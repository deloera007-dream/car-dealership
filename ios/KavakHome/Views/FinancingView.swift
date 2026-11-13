import SwiftUI

struct FinancingView: View {
    @State private var model: FinancingViewModel
    @FocusState private var priceIsFocused: Bool

    init(initialPrice: Double = 350_000) {
        _model = State(initialValue: FinancingViewModel(price: initialPrice))
    }

    var body: some View {
        PrototypePage {
            ScreenHeading(eyebrow: "Financiamiento", title: "Haz espacio\npara tu próximo auto", subtitle: "Explora una mensualidad de ejemplo a tu medida.")

            WhiteCard {
                Label("Simulador ilustrativo", systemImage: "slider.horizontal.3")
                    .font(.title3.bold())
                InputField(title: "Precio del auto (MXN)") {
                    HStack {
                        Text("$").foregroundStyle(.secondary)
                        TextField("Por ejemplo, 350000", text: $model.priceInput)
                            .keyboardType(.numberPad)
                            .focused($priceIsFocused)
                            .accessibilityLabel("Precio del auto en pesos, sin separadores")
                            .accessibilityIdentifier("finance-price")
                    }
                }

                if model.price == nil {
                    Text("Ingresa un precio entre $1 y $3,000,000, solo con números y sin separadores.")
                        .font(.caption).foregroundStyle(.red)
                        .accessibilityIdentifier("finance-error")
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Enganche: \(Int(model.downPaymentPercent))%").font(.headline)
                    Text(model.downPayment.mxn).font(.title2.bold()).foregroundStyle(KavakTheme.deepBlue)
                    Slider(value: $model.downPaymentPercent, in: 10...80, step: 5)
                        .accessibilityLabel("Porcentaje de enganche")
                        .accessibilityValue("\(Int(model.downPaymentPercent)) por ciento")
                        .accessibilityIdentifier("finance-down-payment")
                    HStack {
                        Text("10%")
                        Spacer()
                        Text("80%")
                    }
                    .font(.caption).foregroundStyle(.secondary)
                }

                InputField(title: "Plazo") {
                    SelectionMenu(title: "Plazo", value: "\(model.months) meses", filled: false) {
                        Picker("Plazo en meses", selection: $model.months) {
                            ForEach(FinancingViewModel.terms, id: \.self) { months in
                                Text("\(months) meses").tag(months)
                            }
                        }
                    }
                    .accessibilityIdentifier("finance-term")
                }
            }

            if let estimate = model.estimate {
                WhiteCard {
                    Text("Mensualidad estimada").font(.headline)
                    Text("\(estimate.monthlyPayment.mxn) / mes")
                        .font(.largeTitle.bold()).foregroundStyle(KavakTheme.deepBlue)
                        .accessibilityIdentifier("finance-monthly-payment")
                    Divider()
                    summaryRow("Monto a financiar", value: estimate.principal.mxn)
                    summaryRow("Intereses estimados", value: estimate.interest.mxn)
                    summaryRow("Total con enganche", value: estimate.totalPaid.mxn)
                    Text("Valores en MXN, redondeados al peso. Plazo de \(model.months) meses.")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            WhiteCard {
                Label("Una simulación, no una oferta", systemImage: "info.circle")
                    .font(.headline).foregroundStyle(KavakTheme.deepBlue)
                Text("Tasa fija nominal anual de ejemplo: 14.9%. No incluye seguros, comisiones, impuestos ni CAT. El costo real y la aprobación dependen de una evaluación crediticia y de las condiciones del proveedor.")
                    .font(.subheadline)
                Text("Cálculo local ilustrativo. No se solicita crédito, no se consulta tu historial ni se envían datos.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .tint(KavakTheme.blue)
        .navigationTitle("Financiamiento")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Listo") { priceIsFocused = false }
            }
        }
    }

    private func summaryRow(_ title: String, value: String) -> some View {
        ViewThatFits(in: .horizontal) {
            HStack { Text(title); Spacer(); Text(value).bold() }
            VStack(alignment: .leading, spacing: 5) { Text(title); Text(value).bold() }
        }
        .font(.subheadline)
        .accessibilityElement(children: .combine)
    }
}
