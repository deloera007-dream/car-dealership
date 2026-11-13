import SwiftUI

@main
struct KavakHomeApp: App {
    var body: some Scene {
        WindowGroup {
            HomeShell()
                .environment(\.locale, Locale(identifier: "es_MX"))
                .preferredColorScheme(.light)
        }
    }
}
