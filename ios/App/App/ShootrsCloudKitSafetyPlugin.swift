import Capacitor
import CloudKit
import Foundation

@objc(ShootrsCloudKitSafetyPlugin)
public class ShootrsCloudKitSafetyPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ShootrsCloudKitSafetyPlugin"
    public let jsName = "ShootrsCloudKitSafety"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveSafetyRecord", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fetchSafetyState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveModerationAction", returnType: CAPPluginReturnPromise)
    ]

    private let container = CKContainer(identifier: "iCloud.com.shootr.app")

    private let recordTypes: [String: String] = [
        "reports": "ShootrReport",
        "incidents": "ShootrIncident",
        "supportCases": "ShootrSupportCase",
        "blocks": "ShootrBlock",
        "moderationEvents": "ShootrModerationEvent",
        "moderationActions": "ShootrModerationAction",
        "removedContent": "ShootrRemovedContent",
        "suspensions": "ShootrSuspension",
        "termsAcceptances": "ShootrTermsAcceptance"
    ]

    private let privateCollections: Set<String> = ["blocks", "termsAcceptances"]
    private let sharedSafetyCollections = [
        "reports",
        "incidents",
        "supportCases",
        "moderationEvents",
        "moderationActions",
        "removedContent",
        "suspensions"
    ]

    @objc public func saveSafetyRecord(_ call: CAPPluginCall) {
        guard let type = call.getString("type"), let recordType = recordTypes[type] else {
            call.reject("Unknown safety record type.")
            return
        }
        guard var payload = call.getObject("record") else {
            call.reject("Missing safety record payload.")
            return
        }

        let id = stringValue(payload["id"]) ?? "\(type)-\(UUID().uuidString)"
        payload["id"] = id
        if payload["createdAt"] == nil {
            payload["createdAt"] = isoDateString(Date())
        }

        let record = CKRecord(recordType: recordType, recordID: CKRecord.ID(recordName: id))
        apply(payload: payload, to: record, collection: type)

        database(for: type).save(record) { saved, error in
            if let error = error {
                call.reject("CloudKit save failed: \(error.localizedDescription)")
                return
            }
            call.resolve(self.jsObject(from: saved ?? record, fallback: payload))
        }
    }

    @objc public func fetchSafetyState(_ call: CAPPluginCall) {
        let userId = call.getString("userId") ?? ""
        let admin = call.getBool("admin") ?? false
        let group = DispatchGroup()
        var response = JSObject()
        var firstError: Error?

        let collections = admin
            ? sharedSafetyCollections + Array(privateCollections)
            : ["blocks", "termsAcceptances", "removedContent", "suspensions"]

        for collection in collections {
            guard let recordType = recordTypes[collection] else { continue }
            group.enter()
            let query = CKQuery(recordType: recordType, predicate: predicate(for: collection, userId: userId, admin: admin))
            let operation = CKQueryOperation(query: query)
            operation.resultsLimit = 100
            var items: [JSObject] = []
            operation.recordMatchedBlock = { _, result in
                switch result {
                case .success(let record):
                    items.append(self.jsObject(from: record))
                case .failure(let error):
                    firstError = firstError ?? error
                }
            }
            operation.queryResultBlock = { result in
                if case .failure(let error) = result {
                    firstError = firstError ?? error
                }
                response[collection] = items
                group.leave()
            }
            database(for: collection).add(operation)
        }

        group.notify(queue: .main) {
            if let firstError = firstError {
                call.reject("CloudKit fetch failed: \(firstError.localizedDescription)")
                return
            }
            call.resolve(response)
        }
    }

    @objc public func saveModerationAction(_ call: CAPPluginCall) {
        guard var payload = call.getObject("record") else {
            call.reject("Missing moderation action payload.")
            return
        }
        payload["id"] = stringValue(payload["id"]) ?? "action-\(UUID().uuidString)"
        payload["createdAt"] = stringValue(payload["createdAt"]) ?? isoDateString(Date())

        let action = stringValue(payload["action"]) ?? ""
        let reportId = stringValue(payload["reportId"]) ?? ""
        let contentId = stringValue(payload["contentId"]) ?? ""
        let userId = stringValue(payload["userId"]) ?? ""
        let createdAt = stringValue(payload["createdAt"]) ?? isoDateString(Date())
        let batch = CKModifyRecordsOperation()
        var records: [CKRecord] = []

        let actionRecord = CKRecord(recordType: "ShootrModerationAction", recordID: CKRecord.ID(recordName: stringValue(payload["id"]) ?? "action-\(UUID().uuidString)"))
        apply(payload: payload, to: actionRecord, collection: "moderationActions")
        records.append(actionRecord)

        if action == "remove_content", !contentId.isEmpty {
            let removed = CKRecord(recordType: "ShootrRemovedContent", recordID: CKRecord.ID(recordName: "removed-\(contentId)"))
            apply(payload: [
                "id": "removed-\(contentId)",
                "contentId": contentId,
                "status": "removed",
                "reportId": reportId,
                "removedAt": createdAt,
                "reason": "Admin moderation action"
            ], to: removed, collection: "removedContent")
            records.append(removed)
        }

        if action == "suspend_user", !userId.isEmpty {
            let suspension = CKRecord(recordType: "ShootrSuspension", recordID: CKRecord.ID(recordName: "suspended-\(userId)"))
            apply(payload: [
                "id": "suspended-\(userId)",
                "userId": userId,
                "status": "active",
                "reportId": reportId,
                "suspendedAt": createdAt,
                "reason": "Admin moderation action"
            ], to: suspension, collection: "suspensions")
            records.append(suspension)
        }

        batch.recordsToSave = records
        batch.savePolicy = .changedKeys
        batch.modifyRecordsResultBlock = { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    call.resolve(["ok": true])
                case .failure(let error):
                    call.reject("CloudKit moderation action failed: \(error.localizedDescription)")
                }
            }
        }
        container.publicCloudDatabase.add(batch)
    }

    private func database(for collection: String) -> CKDatabase {
        return privateCollections.contains(collection) ? container.privateCloudDatabase : container.publicCloudDatabase
    }

    private func predicate(for collection: String, userId: String, admin: Bool) -> NSPredicate {
        if admin { return NSPredicate(value: true) }
        switch collection {
        case "blocks":
            return NSPredicate(format: "blockerUserId == %@", userId)
        case "termsAcceptances":
            return NSPredicate(format: "userId == %@", userId)
        case "removedContent", "suspensions":
            return NSPredicate(value: true)
        default:
            return NSPredicate(value: false)
        }
    }

    private func apply(payload: JSObject, to record: CKRecord, collection: String) {
        record["collection"] = collection as CKRecordValue
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
           let json = String(data: data, encoding: .utf8) {
            record["payload"] = json as CKRecordValue
        }
        for (key, value) in payload {
            if let recordValue = cloudKitValue(value) {
                record[key] = recordValue
            }
        }
    }

    private func jsObject(from record: CKRecord, fallback: JSObject = [:]) -> JSObject {
        var object = fallback
        if let payload = record["payload"] as? String,
           let data = payload.data(using: .utf8),
           let decoded = try? JSONSerialization.jsonObject(with: data) as? JSObject {
            object.merge(decoded) { _, new in new }
        }
        object["id"] = object["id"] ?? record.recordID.recordName
        for key in record.allKeys() where key != "payload" {
            object[key] = jsValue(record[key])
        }
        return object
    }

    private func cloudKitValue(_ value: Any?) -> CKRecordValue? {
        if let value = value as? String { return value as CKRecordValue }
        if let value = value as? Int { return NSNumber(value: value) }
        if let value = value as? Double { return NSNumber(value: value) }
        if let value = value as? Bool { return NSNumber(value: value) }
        return nil
    }

    private func jsValue(_ value: CKRecordValue?) -> JSValue? {
        if let value = value as? String { return value }
        if let value = value as? NSNumber { return value }
        if let value = value as? Date { return isoDateString(value) }
        return nil
    }

    private func stringValue(_ value: Any?) -> String? {
        if let value = value as? String, !value.isEmpty { return value }
        return nil
    }

    private func isoDateString(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }
}
