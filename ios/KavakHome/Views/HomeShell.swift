import SwiftUI

struct HomeShell: View {
    @State private var model = HomeViewModel()

    var body: some View {
        TabView(selection: $model.selectedTab) {
            HomeView(model: model)
                .tag(HomeTab.home)
                .tabItem { Label(HomeTab.home.title, systemImage: HomeTab.home.symbol) }

            NavigationStack {
                CatalogView()
                    .navigationDestination(for: Vehicle.self) { vehicle in
                        VehicleDetailView(vehicle: vehicle)
                    }
            }
            .tag(HomeTab.buy)
            .tabItem { Label(HomeTab.buy.title, systemImage: HomeTab.buy.symbol) }

            NavigationStack {
                SellView().toolbar(.hidden, for: .navigationBar)
            }
            .tag(HomeTab.sell)
            .tabItem { Label(HomeTab.sell.title, systemImage: HomeTab.sell.symbol) }

            GarageView()
                .tag(HomeTab.garage)
                .tabItem { Label(HomeTab.garage.title, systemImage: HomeTab.garage.symbol) }

            NavigationStack {
                FinancingView().toolbar(.hidden, for: .navigationBar)
            }
            .tag(HomeTab.financing)
            .tabItem { Label(HomeTab.financing.title, systemImage: HomeTab.financing.symbol) }
        }
        .tint(KavakTheme.blue)
        .toolbarBackground(.white, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarColorScheme(.light, for: .tabBar)
    }
}
