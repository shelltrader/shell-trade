import Foundation
import SQLite3

/// SQLite needs this sentinel so it copies bound strings/blobs instead of
/// referencing memory that Swift may free.
let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

public enum SQLiteError: LocalizedError {
    case open(String), prepare(String), step(String)
    public var errorDescription: String? {
        switch self {
        case .open(let m): return "SQLite open failed: \(m)"
        case .prepare(let m): return "SQLite prepare failed: \(m)"
        case .step(let m): return "SQLite step failed: \(m)"
        }
    }
}

public enum SQLiteValue {
    case null
    case int(Int64)
    case double(Double)
    case text(String)
    case blob(Data)

    public static func opt(_ s: String?) -> SQLiteValue { s.map { .text($0) } ?? .null }
    public static func date(_ d: Date) -> SQLiteValue { .double(d.timeIntervalSince1970) }
    public static func optDate(_ d: Date?) -> SQLiteValue { d.map { .double($0.timeIntervalSince1970) } ?? .null }
}

/// One result row keyed by column name with typed accessors.
public struct Row {
    let values: [String: SQLiteValue]

    public func string(_ key: String) -> String? {
        switch values[key] {
        case .text(let t): return t
        case .int(let n): return String(n)
        case .double(let d): return String(d)
        default: return nil
        }
    }
    public func int(_ key: String) -> Int? {
        switch values[key] {
        case .int(let n): return Int(n)
        case .double(let d): return Int(d)
        case .text(let t): return Int(t)
        default: return nil
        }
    }
    public func double(_ key: String) -> Double? {
        switch values[key] {
        case .double(let d): return d
        case .int(let n): return Double(n)
        case .text(let t): return Double(t)
        default: return nil
        }
    }
    public func date(_ key: String) -> Date? { double(key).map { Date(timeIntervalSince1970: $0) } }
}

public final class SQLiteStatement {
    private var stmt: OpaquePointer?
    private let db: OpaquePointer?

    init(stmt: OpaquePointer?, db: OpaquePointer?) { self.stmt = stmt; self.db = db }

    func finalize() { if stmt != nil { sqlite3_finalize(stmt); stmt = nil } }

    func bind(_ params: [SQLiteValue]) {
        for (i, value) in params.enumerated() {
            let idx = Int32(i + 1)
            switch value {
            case .null: sqlite3_bind_null(stmt, idx)
            case .int(let n): sqlite3_bind_int64(stmt, idx, n)
            case .double(let d): sqlite3_bind_double(stmt, idx, d)
            case .text(let t): sqlite3_bind_text(stmt, idx, t, -1, SQLITE_TRANSIENT)
            case .blob(let data):
                _ = data.withUnsafeBytes {
                    sqlite3_bind_blob(stmt, idx, $0.baseAddress, Int32(data.count), SQLITE_TRANSIENT)
                }
            }
        }
    }

    func step() throws -> Bool {
        switch sqlite3_step(stmt) {
        case SQLITE_ROW: return true
        case SQLITE_DONE: return false
        default: throw SQLiteError.step(String(cString: sqlite3_errmsg(db)))
        }
    }

    func stepDone() throws { _ = try step() }

    func row() -> Row {
        var dict: [String: SQLiteValue] = [:]
        for i in 0..<sqlite3_column_count(stmt) {
            let name = String(cString: sqlite3_column_name(stmt, i))
            dict[name] = columnValue(i)
        }
        return Row(values: dict)
    }

    private func columnValue(_ i: Int32) -> SQLiteValue {
        switch sqlite3_column_type(stmt, i) {
        case SQLITE_INTEGER: return .int(sqlite3_column_int64(stmt, i))
        case SQLITE_FLOAT:   return .double(sqlite3_column_double(stmt, i))
        case SQLITE_NULL:    return .null
        case SQLITE_BLOB:
            if let ptr = sqlite3_column_blob(stmt, i) {
                return .blob(Data(bytes: ptr, count: Int(sqlite3_column_bytes(stmt, i))))
            }
            return .null
        default:
            if let c = sqlite3_column_text(stmt, i) { return .text(String(cString: c)) }
            return .null
        }
    }
}

public final class SQLiteConnection {
    fileprivate var db: OpaquePointer?

    public init(path: String) throws {
        if sqlite3_open(path, &db) != SQLITE_OK {
            let message = String(cString: sqlite3_errmsg(db))
            sqlite3_close(db); db = nil
            throw SQLiteError.open(message)
        }
        sqlite3_busy_timeout(db, 3000)
        try exec("PRAGMA foreign_keys = ON;")
        try exec("PRAGMA journal_mode = WAL;")
    }

    deinit { if db != nil { sqlite3_close(db) } }

    public func exec(_ sql: String) throws {
        var err: UnsafeMutablePointer<CChar>?
        if sqlite3_exec(db, sql, nil, nil, &err) != SQLITE_OK {
            let message = err.map { String(cString: $0) } ?? "unknown error"
            sqlite3_free(err)
            throw SQLiteError.step(message)
        }
    }

    public func prepare(_ sql: String) throws -> SQLiteStatement {
        var handle: OpaquePointer?
        if sqlite3_prepare_v2(db, sql, -1, &handle, nil) != SQLITE_OK {
            throw SQLiteError.prepare(String(cString: sqlite3_errmsg(db)))
        }
        return SQLiteStatement(stmt: handle, db: db)
    }

    public func run(_ sql: String, _ params: [SQLiteValue] = []) throws {
        let statement = try prepare(sql)
        defer { statement.finalize() }
        statement.bind(params)
        try statement.stepDone()
    }

    public func query(_ sql: String, _ params: [SQLiteValue] = []) throws -> [Row] {
        let statement = try prepare(sql)
        defer { statement.finalize() }
        statement.bind(params)
        var rows: [Row] = []
        while try statement.step() { rows.append(statement.row()) }
        return rows
    }

    public func transaction(_ block: () throws -> Void) throws {
        try exec("BEGIN IMMEDIATE TRANSACTION;")
        do { try block(); try exec("COMMIT;") }
        catch { try? exec("ROLLBACK;"); throw error }
    }
}
