# 🍎 App iOS Nativo - Sync Apple Health com PWA

## 📱 Arquitetura

**App iOS (Swift)** → Lê Apple Health → Envia para PWA via Deep Link/URL Scheme

---

## 🛠️ SETUP XCODE (Passo a Passo)

### 1️⃣ Criar Projeto no Xcode

1. Abra **Xcode**
2. File → New → Project
3. Selecione **iOS** → **App**
4. Configure:
   - **Product Name:** `Dieta60Dias`
   - **Team:** Sua conta Apple (pode ser gratuita)
   - **Organization Identifier:** `com.seunome.dieta60dias`
   - **Interface:** SwiftUI
   - **Language:** Swift
   - **Storage:** None
5. Salve em `/Users/joaomarcos/Desktop/dieta/Dieta60DiasApp/`

---

### 2️⃣ Configurar HealthKit

#### 2.1 Adicionar HealthKit Capability

1. No Xcode, selecione o projeto (azul) no navegador esquerdo
2. Vá em **Signing & Capabilities**
3. Clique em **+ Capability**
4. Adicione **HealthKit**
5. ✅ HealthKit habilitado!

#### 2.2 Configurar Info.plist

1. Clique em `Info.plist` no navegador
2. Adicione estas 2 chaves (botão +):

```xml
<key>NSHealthShareUsageDescription</key>
<string>Precisamos ler seus dados de saúde para sincronizar com o app de dieta automaticamente.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>Não vamos escrever dados, apenas ler.</string>
```

---

### 3️⃣ Código Swift - Ler Apple Health

#### 3.1 Criar HealthKitManager.swift

Clique direito na pasta `Dieta60Dias` → New File → Swift File → `HealthKitManager.swift`

```swift
import Foundation
import HealthKit

class HealthKitManager: ObservableObject {
    let healthStore = HKHealthStore()
    
    @Published var weight: Double = 0.0
    @Published var steps: Double = 0.0
    @Published var activeCalories: Double = 0.0
    @Published var exerciseMinutes: Double = 0.0
    @Published var sleepHours: Double = 0.0
    @Published var distance: Double = 0.0
    @Published var heartRate: Double = 0.0
    
    // Tipos de dados que vamos ler
    let readTypes: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .bodyMass)!,
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
        HKObjectType.quantityType(forIdentifier: .appleExerciseTime)!,
        HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
        HKObjectType.quantityType(forIdentifier: .heartRate)!,
        HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
    ]
    
    // Solicitar permissão
    func requestAuthorization(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            completion(false)
            return
        }
        
        healthStore.requestAuthorization(toShare: [], read: readTypes) { success, error in
            completion(success)
        }
    }
    
    // Ler todos os dados de hoje
    func fetchTodayData() async {
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        
        await fetchWeight(from: startOfDay, to: now)
        await fetchSteps(from: startOfDay, to: now)
        await fetchActiveCalories(from: startOfDay, to: now)
        await fetchExerciseMinutes(from: startOfDay, to: now)
        await fetchDistance(from: startOfDay, to: now)
        await fetchHeartRate(from: startOfDay, to: now)
        await fetchSleep(from: startOfDay, to: now)
    }
    
    // Peso
    private func fetchWeight(from start: Date, to end: Date) async {
        guard let weightType = HKQuantityType.quantityType(forIdentifier: .bodyMass) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictEndDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: weightType, predicate: predicate, limit: 1, sortDescriptors: [sortDescriptor]) { _, samples, _ in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            let weightInKg = sample.quantity.doubleValue(for: HKUnit.gramUnit(with: .kilo))
            
            DispatchQueue.main.async {
                self.weight = weightInKg
            }
        }
        
        healthStore.execute(query)
    }
    
    // Passos
    private func fetchSteps(from start: Date, to end: Date) async {
        guard let stepsType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        let query = HKStatisticsQuery(quantityType: stepsType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
            guard let sum = result?.sumQuantity() else { return }
            let steps = sum.doubleValue(for: HKUnit.count())
            
            DispatchQueue.main.async {
                self.steps = steps
            }
        }
        
        healthStore.execute(query)
    }
    
    // Calorias Ativas
    private func fetchActiveCalories(from start: Date, to end: Date) async {
        guard let caloriesType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        let query = HKStatisticsQuery(quantityType: caloriesType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
            guard let sum = result?.sumQuantity() else { return }
            let calories = sum.doubleValue(for: HKUnit.kilocalorie())
            
            DispatchQueue.main.async {
                self.activeCalories = calories
            }
        }
        
        healthStore.execute(query)
    }
    
    // Minutos de Exercício
    private func fetchExerciseMinutes(from start: Date, to end: Date) async {
        guard let exerciseType = HKQuantityType.quantityType(forIdentifier: .appleExerciseTime) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        let query = HKStatisticsQuery(quantityType: exerciseType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
            guard let sum = result?.sumQuantity() else { return }
            let minutes = sum.doubleValue(for: HKUnit.minute())
            
            DispatchQueue.main.async {
                self.exerciseMinutes = minutes
            }
        }
        
        healthStore.execute(query)
    }
    
    // Distância
    private func fetchDistance(from start: Date, to end: Date) async {
        guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        let query = HKStatisticsQuery(quantityType: distanceType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
            guard let sum = result?.sumQuantity() else { return }
            let km = sum.doubleValue(for: HKUnit.meterUnit(with: .kilo))
            
            DispatchQueue.main.async {
                self.distance = km
            }
        }
        
        healthStore.execute(query)
    }
    
    // Frequência Cardíaca (média)
    private func fetchHeartRate(from start: Date, to end: Date) async {
        guard let hrType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        let query = HKStatisticsQuery(quantityType: hrType, quantitySamplePredicate: predicate, options: .discreteAverage) { _, result, _ in
            guard let average = result?.averageQuantity() else { return }
            let bpm = average.doubleValue(for: HKUnit.count().unitDivided(by: HKUnit.minute()))
            
            DispatchQueue.main.async {
                self.heartRate = bpm
            }
        }
        
        healthStore.execute(query)
    }
    
    // Sono (horas)
    private func fetchSleep(from start: Date, to end: Date) async {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
            guard let samples = samples as? [HKCategorySample] else { return }
            
            var totalSleep: TimeInterval = 0
            
            for sample in samples {
                if sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue {
                    totalSleep += sample.endDate.timeIntervalSince(sample.startDate)
                }
            }
            
            let hours = totalSleep / 3600
            
            DispatchQueue.main.async {
                self.sleepHours = hours
            }
        }
        
        healthStore.execute(query)
    }
    
    // Gerar URL para enviar ao PWA
    func generatePWAUrl() -> URL? {
        let baseUrl = "https://joaobueno1.github.io/60dias/index.html"
        var components = URLComponents(string: baseUrl)
        
        components?.queryItems = [
            URLQueryItem(name: "weight", value: String(format: "%.1f", weight)),
            URLQueryItem(name: "steps", value: String(format: "%.0f", steps)),
            URLQueryItem(name: "activeCalories", value: String(format: "%.0f", activeCalories)),
            URLQueryItem(name: "exercise", value: String(format: "%.0f", exerciseMinutes)),
            URLQueryItem(name: "sleep", value: String(format: "%.1f", sleepHours)),
            URLQueryItem(name: "distance", value: String(format: "%.2f", distance)),
            URLQueryItem(name: "heartRate", value: String(format: "%.0f", heartRate))
        ]
        
        return components?.url
    }
}
```

#### 3.2 Criar Interface SwiftUI - ContentView.swift

Substitua o conteúdo de `ContentView.swift`:

```swift
import SwiftUI
import SafariServices

struct ContentView: View {
    @StateObject private var healthManager = HealthKitManager()
    @State private var isAuthorized = false
    @State private var showingSafari = false
    @State private var pwaUrl: URL?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack {
                    Text("💪")
                        .font(.system(size: 80))
                    Text("Transformação 60 Dias")
                        .font(.title)
                        .fontWeight(.bold)
                    Text("Sincronização Apple Health")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
                
                if !isAuthorized {
                    // Botão de Autorização
                    VStack(spacing: 15) {
                        Text("🔐 Permissão Necessária")
                            .font(.headline)
                        
                        Text("Precisamos acessar seus dados do Apple Health para sincronizar automaticamente.")
                            .font(.body)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)
                        
                        Button {
                            healthManager.requestAuthorization { success in
                                isAuthorized = success
                            }
                        } label: {
                            Label("Permitir Acesso", systemImage: "heart.fill")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.red)
                                .cornerRadius(15)
                        }
                        .padding(.horizontal)
                    }
                    .padding()
                } else {
                    // Dados do Health
                    ScrollView {
                        VStack(spacing: 15) {
                            HealthDataRow(icon: "⚖️", label: "Peso", value: String(format: "%.1f kg", healthManager.weight))
                            HealthDataRow(icon: "👟", label: "Passos", value: String(format: "%.0f", healthManager.steps))
                            HealthDataRow(icon: "🔥", label: "Calorias Ativas", value: String(format: "%.0f kcal", healthManager.activeCalories))
                            HealthDataRow(icon: "💪", label: "Exercício", value: String(format: "%.0f min", healthManager.exerciseMinutes))
                            HealthDataRow(icon: "😴", label: "Sono", value: String(format: "%.1f h", healthManager.sleepHours))
                            HealthDataRow(icon: "🏃", label: "Distância", value: String(format: "%.2f km", healthManager.distance))
                            HealthDataRow(icon: "❤️", label: "Freq. Cardíaca", value: String(format: "%.0f bpm", healthManager.heartRate))
                        }
                        .padding()
                    }
                    
                    // Botões de Ação
                    VStack(spacing: 15) {
                        Button {
                            Task {
                                await healthManager.fetchTodayData()
                            }
                        } label: {
                            Label("🔄 Atualizar Dados", systemImage: "arrow.clockwise")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.blue)
                                .cornerRadius(15)
                        }
                        
                        Button {
                            Task {
                                await healthManager.fetchTodayData()
                                if let url = healthManager.generatePWAUrl() {
                                    pwaUrl = url
                                    showingSafari = true
                                }
                            }
                        } label: {
                            Label("📱 Sincronizar com App", systemImage: "icloud.and.arrow.up")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.green)
                                .cornerRadius(15)
                        }
                    }
                    .padding(.horizontal)
                }
                
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingSafari) {
                if let url = pwaUrl {
                    SafariView(url: url)
                }
            }
            .task {
                if isAuthorized {
                    await healthManager.fetchTodayData()
                }
            }
        }
    }
}

// Componente de Linha de Dados
struct HealthDataRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(icon)
                .font(.title2)
            Text(label)
                .font(.body)
                .fontWeight(.medium)
            Spacer()
            Text(value)
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// Safari View Controller
struct SafariView: UIViewControllerRepresentable {
    let url: URL
    
    func makeUIViewController(context: Context) -> SFSafariViewController {
        return SFSafariViewController(url: url)
    }
    
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

#Preview {
    ContentView()
}
```

---

## 🚀 Testar no Simulador/iPhone

### 1. Configurar Conta Apple (Gratuita)

1. Xcode → Settings (Cmd+,) → Accounts
2. Clique em **+** → Add Apple ID
3. Faça login com sua Apple ID
4. Volta no projeto → Signing & Capabilities
5. Selecione seu Time no dropdown

### 2. Executar no iPhone

1. Conecte seu iPhone no Mac (USB)
2. Desbloqueie o iPhone
3. No Xcode, selecione seu iPhone no topo (ao lado de "Dieta60Dias")
4. Clique em ▶️ Run (ou Cmd+R)
5. **Primeira vez:** Settings → General → VPN & Device Management → Confiar no desenvolvedor

### 3. Usar o App

1. Abra o app no iPhone
2. Toque em **"Permitir Acesso"**
3. Autorize os dados do Health
4. Toque em **"Atualizar Dados"** para carregar
5. Toque em **"Sincronizar com App"**
6. Safari abrirá o PWA com os dados!

---

## 🔄 Automação (Opcional)

Para sincronizar automaticamente em background, você pode:

1. **Background Refresh**
2. **Widget iOS**
3. **Push Notifications** (precisa conta Developer paga)

Quer que eu implemente alguma dessas? 🚀
