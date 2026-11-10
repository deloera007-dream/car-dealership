import SwiftUI

struct SellView: View {
    @State private var model = SellViewModel()
    @FocusState private var focusedField: Field?
    private enum Field { case trim, mileage }

    var body: some View {
        ScrollViewReader { proxy in
            PrototypePage {
                ScreenHeading(eyebrow: "Vender", title: "Tu auto vale\nun nuevo comienzo", subtitle: "Conoce un rango ilustrativo de su valor en unos pasos.")

                WhiteCard {
                    Text("Cuéntanos de tu auto").font(.title2.bold())
                    InputField(title: "Marca") {
                        SelectionMenu(title: "Marca", value: model.form.brand.isEmpty ? "Selecciona una marca" : model.form.brand, filled: false) {
                            Picker("Marca", selection: Binding(get: { model.form.brand }, set: { model.selectBrand($0) })) {
                                Text("Selecciona una marca").tag("")
                                ForEach(SampleInventory.brands, id: \.self) { Text($0).tag($0) }
                            }
                        }
                        .accessibilityIdentifier("sell-brand")
                    }
                    InputField(title: "Modelo") {
                        SelectionMenu(title: "Modelo", value: model.form.model.isEmpty ? "Selecciona un modelo" : model.form.model, filled: false) {
                            Picker("Modelo", selection: $model.form.model) {
                                Text("Selecciona un modelo").tag("")
                                ForEach(model.models, id: \.self) { Text($0).tag($0) }
                            }
                        }
                        .disabled(model.form.brand.isEmpty)
                        .accessibilityIdentifier("sell-model")
                    }
                    InputField(title: "Año") {
                        SelectionMenu(title: "Año", value: String(model.form.year), filled: false) {
                            Picker("Año", selection: $model.form.year) {
                                ForEach((2015...SampleInventory.referenceYear).reversed(), id: \.self) { year in
                                    Text(String(year)).tag(year)
                                }
                            }
                        }
                        .accessibilityIdentifier("sell-year")
                    }
                    InputField(title: "Versión") {
                        TextField("Por ejemplo, Grand Touring", text: $model.form.trim)
                            .textInputAutocapitalization(.words)
                            .autocorrectionDisabled()
                            .focused($focusedField, equals: .trim)
                            .submitLabel(.next)
                            .onSubmit { focusedField = .mileage }
                            .accessibilityLabel("Versión")
                            .accessibilityIdentifier("sell-trim")
                    }
                    InputField(title: "Kilometraje") {
                        HStack {
                            TextField("Por ejemplo, 35000", text: $model.form.mileage)
                                .keyboardType(.numberPad)
                                .focused($focusedField, equals: .mileage)
                                .accessibilityLabel("Kilometraje, sin separadores")
                                .accessibilityIdentifier("sell-mileage")
                            Text("km").foregroundStyle(.secondary)
                        }
                    }
                    if let message = model.validationMessage {
                        Label(message, systemImage: "exclamationmark.circle")
                            .font(.subheadline)
                            .foregroundStyle(.red)
                            .accessibilityIdentifier("sell-error")
                    }
                    PrimaryAction(title: "Cotizar mi auto") {
                        focusedField = nil
                        model.submit()
                    }
                    .accessibilityIdentifier("sell-submit")
                    Text("Solo usamos datos locales de ejemplo. No se envía información ni se inicia una venta.")
                        .font(.caption).foregroundStyle(.secondary)
                }

                if let result = model.result {
                    WhiteCard {
                        Label("Estimación ilustrativa", systemImage: "sparkles")
                            .font(.headline).foregroundStyle(KavakTheme.deepBlue)
                        Text("\(model.form.brand) \(model.form.model) · \(String(model.form.year))")
                            .font(.subheadline)
                        Text("Entre \(result.lower.mxn) y \(result.upper.mxn) MXN")
                            .font(.title2.bold())
                            .accessibilityIdentifier("valuation-range")
                        Text("No es una oferta de compra. El rango es ficticio y no considera el estado, historial ni versión del auto. Una valuación real requiere inspección.")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                    .id("valuation-result")
                }
                DemoDisclaimer(text: "Valuación de demostración con año de referencia 2026. Los precios no representan el mercado actual.")
            }
            .onChange(of: model.result) { _, result in
                if result != nil {
                    withAnimation { proxy.scrollTo("valuation-result", anchor: .center) }
                }
            }
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Listo") { focusedField = nil }
                }
            }
        }
        .tint(KavakTheme.blue)
    }
}
