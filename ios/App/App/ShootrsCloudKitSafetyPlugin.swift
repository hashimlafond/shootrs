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
    private let appWritableCollections: Set<String> = [
        "reports",
        "blocks",
        "termsAcceptances"
    ]

    @objc public func saveSafetyRecord(_ call: CAPPluginCall) {
        guard let type = call.getString("type"), let recordType = recordTypes[type] else {
            call.reject("Unknown safety record type.")
            return
        }
        guard appWritableCollections.contains(type) else {
            call.reject("This safety record type requires moderator access.")
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
                call.reject(self.cloudKitErrorMessage(error, collection: type, recordType: recordType, recordId: id))
                return
            }
            call.resolve(self.jsObject(from: saved ?? record, fallback: payload))
        }
    }

    @objc public func fetchSafetyState(_ call: CAPPluginCall) {
        let admin = call.getBool("admin") ?? false
        if admin {
            call.reject("Admin moderation records are not exposed to the ordinary iPhone app. Use CloudKit Console or cktool with a management token.")
            return
        }
        call.resolve([
            "blocks": JSArray(),
            "termsAcceptances": JSArray(),
            "removedContent": JSArray(),
            "suspensions": JSArray()
        ])
    }

    @objc public func saveModerationAction(_ call: CAPPluginCall) {
        call.reject("Moderator actions are not exposed to the ordinary iPhone app. Use CloudKit Console or cktool with a management token.")
    }

    private func database(for collection: String) -> CKDatabase {
        return privateCollections.contains(collection) ? container.privateCloudDatabase : container.publicCloudDatabase
    }

    private func databaseScope(for collection: String) -> String {
        return privateCollections.contains(collection) ? "private" : "public"
    }

    private func cloudKitErrorMessage(_ error: Error, collection: String, recordType: String, recordId: String) -> String {
        let nsError = error as NSError
        var parts = [
            "CloudKit save failed",
            "domain=\(nsError.domain)",
            "code=\(nsError.code)",
            "description=\(nsError.localizedDescription)",
            "container=iCloud.com.shootr.app",
            "database=\(databaseScope(for: collection))",
            "collection=\(collection)",
            "recordType=\(recordType)",
            "recordId=\(recordId)"
        ]
        if let serverMessage = nsError.userInfo["ServerErrorDescription"] as? String {
            parts.append("serverMessage=\(serverMessage)")
        }
        if let partialErrors = nsError.userInfo[CKPartialErrorsByItemIDKey] as? [AnyHashable: Error], !partialErrors.isEmpty {
            let details = partialErrors.map { key, value in
                let partial = value as NSError
                return "\(key):\(partial.domain)#\(partial.code):\(partial.localizedDescription)"
            }.joined(separator: " | ")
            parts.append("partialErrors=\(details)")
        }
        print("[ShootrsCloudKitSafety] \(parts.joined(separator: "; "))")
        return parts.joined(separator: "; ")
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
