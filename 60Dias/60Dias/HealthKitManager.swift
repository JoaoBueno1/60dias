import Foundation
import HealthKit
import Combine

class HealthKitManager: ObservableObject {
    let healthStore = HKHealthStore()
    
    @Published var weight: Double = 0.0
    @Published var steps: Double = 0.0
    @Published var activeCalories: Double = 0.0
    @Published var exerciseMinutes: Double = 0.0
    @Published var sleepHours: Double = 0.0
    @Published var distance: Double = 0.0
    @Published var heartRate: Double = 0.0
    @Published var bodyFatPercentage: Double = 0.0
    @Published var leanBodyMass: Double = 0.0
    
    let readTypes: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .bodyMass)!,
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
        HKObjectType.quantityType(forIdentifier: .appleExerciseTime)!,
        HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
        HKObjectType.quantityType(forIdentifier: .heartRate)!,
        HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
        HKObjectType.quantityType(forIdentifier: .bodyFatPercentage)!,
        HKObjectType.quantityType(forIdentifier: .leanBodyMass)!
    ]
    
    func requestAuthorization(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            completion(false)
            return
        }
        
        healthStore.requestAuthorization(toShare: [], read: readTypes) { success, error in
            completion(success)
        }
    }
    
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
        await fetchBodyFat(from: startOfDay, to: now)
        await fetchLeanBodyMass(from: startOfDay, to: now)
    }
    
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
    
    private func fetchSleep(from start: Date, to end: Date) async {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
            guard let samples = samples as? [HKCategorySample] else { return }
            
            var totalSleep: TimeInterval = 0
            
            for sample in samples {
                if sample.value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue ||
                   sample.value == HKCategoryValueSleepAnalysis.asleepCore.rawValue ||
                   sample.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue ||
                   sample.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue {
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
    

    private func fetchBodyFat(from start: Date, to end: Date) async {
        guard let fatType = HKQuantityType.quantityType(forIdentifier: .bodyFatPercentage) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictEndDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: fatType, predicate: predicate, limit: 1, sortDescriptors: [sortDescriptor]) { _, samples, _ in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            let percentage = sample.quantity.doubleValue(for: HKUnit.percent()) * 100
            
            DispatchQueue.main.async {
                self.bodyFatPercentage = percentage
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchLeanBodyMass(from start: Date, to end: Date) async {
        guard let leanType = HKQuantityType.quantityType(forIdentifier: .leanBodyMass) else { return }
        
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictEndDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: leanType, predicate: predicate, limit: 1, sortDescriptors: [sortDescriptor]) { _, samples, _ in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            let kg = sample.quantity.doubleValue(for: HKUnit.gramUnit(with: .kilo))
            
            DispatchQueue.main.async {
                self.leanBodyMass = kg
            }
        }
        
        healthStore.execute(query)
    }
    
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
            URLQueryItem(name: "heartRate", value: String(format: "%.0f", heartRate)),
            URLQueryItem(name: "bodyFat", value: String(format: "%.1f", bodyFatPercentage)),
            URLQueryItem(name: "leanMass", value: String(format: "%.1f", leanBodyMass))
        ]
        
        return components?.url
    }
}
