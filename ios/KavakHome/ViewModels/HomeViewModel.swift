import Observation

@MainActor
@Observable
final class HomeViewModel {
    let features = HomeFeature.allCases
    var selectedTab = HomeTab.home

    func open(_ feature: HomeFeature) {
        guard let tab = HomeTab.allCases.first(where: { $0.feature == feature }) else { return }
        selectedTab = tab
    }

    func select(_ tab: HomeTab) {
        selectedTab = tab
    }
}
