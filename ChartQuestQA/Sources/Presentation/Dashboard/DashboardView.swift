import SwiftUI
import AppKit

struct DashboardView: View {
    @EnvironmentObject private var env: AppEnvironment
    @EnvironmentObject private var windows: WindowManager
    @StateObject private var vm = DashboardViewModel()

    @State private var showStartSession = false
    @State private var newSessionName = ""
    @State private var reportMarkdown: String?
    @State private var showReport = false
    @State private var generatingReport = false
    @State private var batchRunning = false
    @State private var banner: String?

    var body: some View {
        HSplitView {
            leftPane.frame(minWidth: 360, idealWidth: 390, maxWidth: 480)
            rightPane.frame(minWidth: 520)
        }
        .background(Theme.bg)
        .foregroundStyle(Theme.ink)
        .onDeleteCommand { vm.deleteSelected() }
        .toolbar { toolbarContent }
        .onAppear { vm.configure(env) }
        .onReceive(NotificationCenter.default.publisher(for: .cqReviewsChanged)) { _ in vm.reload() }
        .onReceive(NotificationCenter.default.publisher(for: .cqOpenReview)) { note in
            if let id = note.object as? String { vm.selectedID = id }
        }
        .sheet(isPresented: $showStartSession) { startSessionSheet }
        .sheet(isPresented: $showReport) {
            SessionReportView(markdown: reportMarkdown ?? "", sessionName: env.activeSession?.name ?? "Session")
                .environmentObject(env)
        }
        .overlay(alignment: .bottom) {
            if let banner {
                Text(banner).font(.caption).padding(.horizontal, 14).padding(.vertical, 8)
                    .background(Capsule().fill(Theme.surfaceHi)).overlay(Capsule().stroke(Theme.line))
                    .padding(.bottom, 14).transition(.opacity)
                    .onAppear { DispatchQueue.main.asyncAfter(deadline: .now() + 2.4) { self.banner = nil } }
            }
        }
    }

    // MARK: Left

    private var leftPane: some View {
        VStack(spacing: 0) {
            statsBar
            searchAndFilters
            Divider().overlay(Theme.line)
            if vm.reviews.isEmpty {
                emptyList
            } else {
                List(selection: $vm.selectedID) {
                    ForEach(vm.reviews) { r in
                        ReviewCardView(review: r, selected: r.id == vm.selectedID)
                            .environmentObject(env)
                            .tag(r.id)
                            .listRowInsets(EdgeInsets(top: 4, leading: 10, bottom: 4, trailing: 10))
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                            .contextMenu {
                                Button("Compare versions") { windows.openComparison(review: r) }
                                Button("Reveal screenshot in Finder") { reveal(r.originalPath) }
                                Divider()
                                Button("Delete", role: .destructive) { vm.delete(r.id) }
                            }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .onDeleteCommand { vm.deleteSelected() }
            }
        }
        .background(Theme.bg)
    }

    private var statsBar: some View {
        HStack(spacing: 8) {
            stat("\(vm.total)", "Total", "#9FB0CF")
            stat("\(vm.openCount)", "Open", "#9FB0CF")
            stat("\(vm.inProgressCount)", "Active", "#FFCE5C")
            stat("\(vm.resolvedCount)", "Resolved", "#16F29A")
            stat("\(vm.criticalCount)", "Critical", "#EF4444")
        }.padding(.horizontal, 12).padding(.top, 12)
    }

    private func stat(_ n: String, _ label: String, _ hex: String) -> some View {
        VStack(spacing: 2) {
            Text(n).font(.system(size: 18, weight: .bold, design: .rounded)).foregroundStyle(Color(hex: hex))
            Text(label).font(.system(size: 9, weight: .semibold)).foregroundStyle(Theme.inkFaint)
        }.frame(maxWidth: .infinity).padding(.vertical, 8)
        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.surface))
    }

    private var searchAndFilters: some View {
        VStack(spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "magnifyingglass").foregroundStyle(Theme.inkFaint)
                TextField("Search id, notes, AI issues…", text: $vm.filter.keyword).textFieldStyle(.plain)
                if !vm.filter.isEmpty {
                    Button { vm.clearFilters() } label: { Image(systemName: "xmark.circle.fill") }
                        .buttonStyle(.plain).foregroundStyle(Theme.inkFaint)
                }
            }
            .padding(8).background(RoundedRectangle(cornerRadius: 8).fill(Theme.surface))

            HStack(spacing: 6) {
                filterMenu("Category", systemImage: "tag", selection: vm.filter.category?.title) {
                    Button("All categories") { vm.filter.category = nil }
                    Divider()
                    ForEach(Category.allCases) { c in Button(c.title) { vm.filter.category = c } }
                }
                filterMenu("Status", systemImage: "circle.dashed", selection: vm.filter.status?.title) {
                    Button("All statuses") { vm.filter.status = nil }
                    Divider()
                    ForEach(ReviewStatus.allCases) { s in Button(s.title) { vm.filter.status = s } }
                }
                filterMenu("Priority", systemImage: "flag", selection: vm.filter.priority?.title) {
                    Button("All priorities") { vm.filter.priority = nil }
                    Divider()
                    ForEach(Priority.allCases) { p in Button(p.title) { vm.filter.priority = p } }
                }
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
    }

    private func filterMenu<C: View>(_ title: String, systemImage: String, selection: String?, @ViewBuilder content: () -> C) -> some View {
        Menu {
            content()
        } label: {
            HStack(spacing: 4) {
                Image(systemName: systemImage).font(.system(size: 10))
                Text(selection ?? title).font(.system(size: 11, weight: .medium)).lineLimit(1)
            }
            .padding(.horizontal, 8).padding(.vertical, 5)
            .background(RoundedRectangle(cornerRadius: 7).fill(selection == nil ? Theme.surface : Theme.accent.opacity(0.18)))
        }
        .menuStyle(.borderlessButton).fixedSize()
    }

    private var emptyList: some View {
        VStack(spacing: 10) {
            Spacer()
            Image(systemName: "camera.viewfinder").font(.system(size: 32)).foregroundStyle(Theme.inkFaint)
            Text(vm.filter.isEmpty ? "No reviews yet" : "No matches").font(.headline)
            Text(vm.filter.isEmpty ? "Press \(AppInfo.captureHotkeyDisplay) while playtesting to capture your first review."
                                   : "Try clearing filters.")
                .font(.caption).foregroundStyle(Theme.inkSoft).multilineTextAlignment(.center).padding(.horizontal, 30)
            Spacer()
        }.frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: Right

    private var rightPane: some View {
        Group {
            if let r = vm.selected {
                ReviewDetailView(reviewID: r.id).environmentObject(env).environmentObject(windows).id(r.id)
            } else {
                VStack(spacing: 8) {
                    Image(systemName: "sidebar.right").font(.system(size: 30)).foregroundStyle(Theme.inkFaint)
                    Text("Select a review").foregroundStyle(Theme.inkSoft)
                }.frame(maxWidth: .infinity, maxHeight: .infinity).background(Theme.bg)
            }
        }
    }

    // MARK: Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItemGroup(placement: .primaryAction) {
            Button { AppController.shared?.menuCapture() } label: { Label("Capture", systemImage: "camera.viewfinder") }
                .help("Capture region (\(AppInfo.captureHotkeyDisplay))")
            Button { AppController.shared?.menuQuickNote() } label: { Label("Quick Note", systemImage: "note.text.badge.plus") }
            Button { windows.openBatchImport() } label: { Label("Batch", systemImage: "square.grid.2x2") }
                .help("Batch import screenshots (⌘⇧B)")

            Menu {
                if let s = env.activeSession {
                    Text("Active: \(s.name)")
                    Button("Generate Session Report") { Task { await generateReport(endAfter: false) } }
                    Button("End Session & Generate Report") { Task { await generateReport(endAfter: true) } }
                } else {
                    Button("Start Playtest Session…") { newSessionName = defaultSessionName(); showStartSession = true }
                }
            } label: { Label(env.activeSession == nil ? "Session" : "● Session", systemImage: "record.circle") }

            Menu {
                ForEach(ExportService.Format.allCases) { fmt in
                    Button("Export list as \(fmt.title)") { export(fmt) }
                }
            } label: { Label("Export", systemImage: "square.and.arrow.up") }

            Menu {
                let pending = vm.reviews.filter { $0.analysis == nil }.count
                Button("Batch-analyze un-analyzed (\(pending))") { Task { await batchAnalyze() } }
                    .disabled(pending == 0 || batchRunning)
                Button("Daily QA Summary") { Task { await dailySummary() } }
            } label: { Label("AI tools", systemImage: "wand.and.stars") }

            Button { windows.toggleFloatingPanel() } label: { Label("Floating", systemImage: "pip") }
        }
    }

    // MARK: Sheets / actions

    private var startSessionSheet: some View {
        VStack(spacing: 16) {
            Text("Start Playtest Session").font(.headline)
            TextField("Session name", text: $newSessionName).textFieldStyle(.roundedBorder).frame(width: 280)
            HStack {
                Button("Cancel") { showStartSession = false }
                Button("Start") { env.startSession(named: newSessionName); showStartSession = false }
                    .keyboardShortcut(.defaultAction).disabled(newSessionName.isEmpty)
            }
        }.padding(24).frame(width: 340)
    }

    private func defaultSessionName() -> String {
        let f = DateFormatter(); f.dateFormat = "MMM d, HH:mm"; return "Playtest \(f.string(from: Date()))"
    }

    private func generateReport(endAfter: Bool) async {
        guard let session = env.activeSession else { return }
        guard let apiKey = KeychainStore.loadAPIKey(), !apiKey.isEmpty else {
            banner = "Add a Claude API key in Settings ▸ AI."; return
        }
        var f = ReviewFilter(); f.sessionId = session.id
        let reviews = (try? env.reviewRepo.fetchAll(filter: f)) ?? []
        guard !reviews.isEmpty else { banner = "No reviews in this session yet."; return }

        generatingReport = true
        let request = SessionReportRequest(sessionName: session.name, reviews: reviews,
                                           model: env.settings.model, maxTokens: max(env.settings.maxTokens, 3000))
        do {
            let md = try await env.aiService.sessionReport(request, apiKey: apiKey)
            reportMarkdown = md
            if endAfter { env.endActiveSession(reportMarkdown: md) }
            else { var s = session; s.reportMarkdown = md; try? env.sessionRepo.update(s) }
            showReport = true
        } catch {
            banner = error.localizedDescription
        }
        generatingReport = false
    }

    // Bonus: Batch Analysis — analyze every un-analyzed review in the current view.
    private func batchAnalyze() async {
        guard let apiKey = KeychainStore.loadAPIKey(), !apiKey.isEmpty else {
            banner = "Add a Claude API key in Settings ▸ AI."; return
        }
        batchRunning = true
        let pending = vm.reviews.filter { $0.analysis == nil }
        var done = 0
        for r in pending {
            let original = try? Data(contentsOf: env.fileStore.absoluteURL(for: r.originalPath))
            let annotated = r.annotatedPath.flatMap { try? Data(contentsOf: env.fileStore.absoluteURL(for: $0)) }
            let req = AnalysisRequest(originalPNG: original, annotatedPNG: annotated,
                                      annotationsSummary: PromptBuilder.annotationsSummary(r.annotations),
                                      transcript: r.transcript, userNotes: r.userNotes, category: r.category,
                                      model: env.settings.model, maxTokens: env.settings.maxTokens,
                                      temperature: env.settings.temperature,
                                      customSystemPrompt: env.settings.customPrompt.isEmpty ? nil : env.settings.customPrompt)
            if let analysis = try? await env.aiService.analyze(req, apiKey: apiKey) {
                var updated = r; updated.analysis = analysis; updated.severity = analysis.topSeverity
                try? env.reviewRepo.save(updated); done += 1
                banner = "Batch analyzing… \(done)/\(pending.count)"
            }
        }
        env.notifyChanged()
        batchRunning = false
        banner = "Batch analysis complete: \(done)/\(pending.count)"
    }

    // Bonus: Daily QA Summary — synthesize today's reviews into one report.
    private func dailySummary() async {
        guard let apiKey = KeychainStore.loadAPIKey(), !apiKey.isEmpty else {
            banner = "Add a Claude API key in Settings ▸ AI."; return
        }
        var f = ReviewFilter(); f.dateFrom = Calendar.current.startOfDay(for: Date())
        let todays = (try? env.reviewRepo.fetchAll(filter: f)) ?? []
        guard !todays.isEmpty else { banner = "No reviews captured today yet."; return }
        let df = DateFormatter(); df.dateStyle = .full
        let req = SessionReportRequest(sessionName: "Daily QA Summary — \(df.string(from: Date()))",
                                       reviews: todays, model: env.settings.model, maxTokens: max(env.settings.maxTokens, 3000))
        do {
            reportMarkdown = try await env.aiService.sessionReport(req, apiKey: apiKey)
            showReport = true
        } catch { banner = error.localizedDescription }
    }

    private func export(_ format: ExportService.Format) {
        do {
            let name = "ChartQuest_Reviews_\(Int(Date().timeIntervalSince1970))"
            let url = try env.exportService.export(reviews: vm.reviews, format: format, baseName: name)
            NSWorkspace.shared.activateFileViewerSelecting([url])
            banner = "Exported \(vm.reviews.count) reviews → \(url.lastPathComponent)"
        } catch { banner = error.localizedDescription }
    }

    private func reveal(_ relativePath: String) {
        NSWorkspace.shared.activateFileViewerSelecting([env.fileStore.absoluteURL(for: relativePath)])
    }
}
