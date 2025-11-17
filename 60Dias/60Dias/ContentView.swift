//
//  ContentView.swift
//  60Dias
//
//  Created by João Marcos on 17/11/2025.
//

import SwiftUI
import SafariServices

struct ContentView: View {
    @StateObject private var healthKit = HealthKitManager()
    @State private var isAuthorized = false
    @State private var showSafari = false
    @State private var isSyncing = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if !isAuthorized {
                        VStack(spacing: 15) {
                            Image(systemName: "heart.text.square.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.red)
                            
                            Text("60 Dias")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                            
                            Text("Autorize o acesso ao Apple Health para sincronizar seus dados")
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                            
                            Button(action: requestAuthorization) {
                                HStack {
                                    Image(systemName: "heart.fill")
                                    Text("Autorizar Apple Health")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.red)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                            }
                            .padding(.horizontal)
                        }
                        .padding(.top, 50)
                    } else {
                        VStack(spacing: 15) {
                            Text("Dados de Hoje")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            HealthDataCard(title: "Peso", value: String(format: "%.1f kg", healthKit.weight), icon: "scalemass")
                            HealthDataCard(title: "Passos", value: String(format: "%.0f", healthKit.steps), icon: "figure.walk")
                            HealthDataCard(title: "Calorias Ativas", value: String(format: "%.0f kcal", healthKit.activeCalories), icon: "flame")
                            HealthDataCard(title: "Exercício", value: String(format: "%.0f min", healthKit.exerciseMinutes), icon: "figure.run")
                            HealthDataCard(title: "Sono", value: String(format: "%.1f h", healthKit.sleepHours), icon: "bed.double")
                            
                            Divider()
                                .padding(.vertical, 10)
                            
                            Text("Dados Avançados (KPIs Futuros)")
                                .font(.headline)
                                .foregroundColor(.gray)
                            
                            HealthDataCard(title: "% Gordura", value: String(format: "%.1f%%", healthKit.bodyFatPercentage), icon: "percent")
                            HealthDataCard(title: "Massa Magra", value: String(format: "%.1f kg", healthKit.leanBodyMass), icon: "figure.arms.open")
                            HealthDataCard(title: "Distância", value: String(format: "%.2f km", healthKit.distance), icon: "location")
                            HealthDataCard(title: "Frequência Cardíaca", value: String(format: "%.0f bpm", healthKit.heartRate), icon: "heart")
                            
                            Button(action: syncData) {
                                HStack {
                                    if isSyncing {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    } else {
                                        Image(systemName: "arrow.triangle.2.circlepath")
                                    }
                                    Text(isSyncing ? "Sincronizando..." : "Sincronizar com PWA")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                            }
                            .disabled(isSyncing)
                            .padding(.horizontal)
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("60 Dias")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showSafari) {
            if let url = healthKit.generatePWAUrl() {
                SafariView(url: url)
            }
        }
    }
    
    func requestAuthorization() {
        healthKit.requestAuthorization { success in
            DispatchQueue.main.async {
                isAuthorized = success
                if success {
                    Task {
                        await healthKit.fetchTodayData()
                    }
                }
            }
        }
    }
    
    func syncData() {
        isSyncing = true
        Task {
            await healthKit.fetchTodayData()
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            DispatchQueue.main.async {
                isSyncing = false
                showSafari = true
            }
        }
    }
}

struct HealthDataCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 40)
            
            VStack(alignment: .leading) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(value)
                    .font(.headline)
            }
            
            Spacer()
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

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
