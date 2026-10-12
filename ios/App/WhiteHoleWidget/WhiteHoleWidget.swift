import WidgetKit
import SwiftUI

struct HabitDay: Decodable {
    let done: Int
    let scheduled: Int
    let streak: Int
    let dots: [Bool]
}
struct WidgetPayload: Decodable {
    let cutoff: Int
    let theme: String
    let days: [String: HabitDay]
}
struct WhiteHoleEntry: TimelineEntry {
    let date: Date
    let stats: HabitDay?
    let theme: String
}
struct WhiteHoleProvider: TimelineProvider {
    func placeholder(in context: Context) -> WhiteHoleEntry {
        WhiteHoleEntry(date: .now, stats: HabitDay(done: 4, scheduled: 5, streak: 7, dots: [true,true,true,true,false]), theme: "system")
    }
    func payload() -> WidgetPayload? {
        guard let text = UserDefaults(suiteName: "group.app.whitehole.habits")?.string(forKey: "whitehole.payload"), let data = text.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetPayload.self, from: data)
    }
    func entry(at date: Date, payload: WidgetPayload?) -> WhiteHoleEntry {
        let calendar = Calendar.current
        var logical = date
        if calendar.component(.hour, from: date) < (payload?.cutoff ?? 0) {
            logical = calendar.date(byAdding: .day, value: -1, to: date) ?? date
        }
        let format = DateFormatter(); format.calendar = Calendar(identifier: .gregorian); format.locale = Locale(identifier: "en_US_POSIX"); format.timeZone = .current; format.dateFormat = "yyyy-MM-dd"
        return WhiteHoleEntry(date: date, stats: payload?.days[format.string(from: logical)], theme: payload?.theme ?? "system")
    }
    func getSnapshot(in context: Context, completion: @escaping (WhiteHoleEntry) -> Void) {
        completion(context.isPreview ? placeholder(in: context) : entry(at: .now, payload: payload()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<WhiteHoleEntry>) -> Void) {
        let data = payload(), now = Date()
        // Calendar-based boundaries avoid subtracting fixed 24h across DST changes.
        let calendar = Calendar.current
        var entries = [entry(at: now, payload: data)]
        for offset in 0..<7 {
            guard let day = calendar.date(byAdding: .day, value: offset, to: now),
                  let boundary = calendar.date(bySettingHour: data?.cutoff ?? 0, minute: 0, second: 0, of: day), boundary > now else { continue }
            entries.append(entry(at: boundary, payload: data))
        }
        completion(Timeline(entries: entries, policy: .after(calendar.date(byAdding: .day, value: 1, to: now) ?? now.addingTimeInterval(86400))))
    }
}
struct WhiteHoleWidgetView: View {
    let entry: WhiteHoleEntry
    @Environment(\.colorScheme) var scheme
    @Environment(\.widgetFamily) var family
    var dark: Bool { entry.theme == "dark" || (entry.theme == "system" && scheme == .dark) }
    var foreground: Color { dark ? Color(white: 0.85) : Color.black }
    var body: some View {
        Group {
            if family == .accessoryInline {
                Text("WhiteHole · 🔥 \(entry.stats?.streak ?? 0)")
            } else if family == .accessoryRectangular {
                VStack(alignment: .leading, spacing: 5) {
                    Text("WhiteHole").font(.headline)
                    Text("\(entry.stats?.done ?? 0)/\(entry.stats?.scheduled ?? 0) · 🔥 \(entry.stats?.streak ?? 0)").font(.caption)
                }
            } else {
                VStack(alignment: .leading, spacing: 18) {
                    HStack {
                        Text("WhiteHole").font(.custom("DMSans-9ptRegular", size: 15))
                        Spacer()
                        Text("🔥 \(entry.stats?.streak ?? 0)").font(.custom("DMSans-9ptRegular", size: 14))
                    }
                    HStack(spacing: 7) {
                        ForEach(Array((entry.stats?.dots ?? []).prefix(family == .systemSmall ? 5 : 10).enumerated()), id: \.offset) { _, done in
                            Circle().fill(done ? foreground : Color.clear).overlay(Circle().stroke(foreground.opacity(done ? 1 : 0.5), lineWidth: 1)).frame(width: 8, height: 8)
                        }
                        Spacer(minLength: 8)
                        Text(entry.stats == nil ? "Open to refresh" : "\(entry.stats!.done)/\(entry.stats!.scheduled)").font(.custom("DMSans-9ptRegular", size: 12)).foregroundStyle(foreground.opacity(0.75))
                    }
                }.foregroundStyle(foreground)
            }
        }
        .widgetURL(URL(string: "whitehole://checkin"))
        .containerBackground(for: .widget) { LinearGradient(colors: dark ? [Color(white: 0.063), Color(white: 0.227)] : [Color(white: 0.96), Color(white: 0.85)], startPoint: .leading, endPoint: .trailing) }
    }
}
@main
struct WhiteHoleDots: Widget {
    let kind = "WhiteHoleDots"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WhiteHoleProvider()) { WhiteHoleWidgetView(entry: $0) }
            .configurationDisplayName("WhiteHole")
            .description("Today’s habits and your check-in streak.")
            .supportedFamilies([.systemSmall, .systemMedium, .accessoryInline, .accessoryRectangular])
    }
}
