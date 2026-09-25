
import pandas as pd
import numpy as np
import os

# Define cities, levers, and metrics
cities = ['Delhi', 'Ahmedabad', 'Surat']
levers = {
    'ev_adoption_pct': (0, 100), # EV Adoption %
    'solar_adoption_pct': (0, 100), # Solar Adoption %
    'trees_planted_pct': (0, 100), # Trees Planted %
    'plastic_recycling_pct': (0, 100), # Plastic Recycling %
    'public_transport_usage_pct': (0, 100) # Public Transport Usage %
}
metrics = ['co2_emissions', 'aqi', 'electricity_demand', 'green_score']

# Baseline data (approximate, for synthetic generation)
baseline_data = {
    'Delhi': {
        'ev_adoption_pct': 12, 'solar_adoption_pct': 8, 'trees_planted_pct': 23, 'plastic_recycling_pct': 55, 'public_transport_usage_pct': 45,
        'co2_emissions': 1000, 'aqi': 220, 'electricity_demand': 1500, 'green_score': 40
    },
    'Ahmedabad': {
        'ev_adoption_pct': 7, 'solar_adoption_pct': 18, 'trees_planted_pct': 12.5, 'plastic_recycling_pct': 65, 'public_transport_usage_pct': 30,
        'co2_emissions': 700, 'aqi': 140, 'electricity_demand': 1000, 'green_score': 60
    },
    'Surat': {
        'ev_adoption_pct': 6, 'solar_adoption_pct': 22, 'trees_planted_pct': 4, 'plastic_recycling_pct': 65, 'public_transport_usage_pct': 28,
        'co2_emissions': 500, 'aqi': 110, 'electricity_demand': 800, 'green_score': 70
    }
}

def generate_synthetic_data(city_name, num_samples=1000):
    data = []
    baseline = baseline_data[city_name]

    for _ in range(num_samples):
        sample = {'city': city_name}
        current_levers = {}

        # Generate lever values with some variation around baseline
        for lever, (min_val, max_val) in levers.items():
            current_levers[lever] = np.clip(baseline[lever] + np.random.uniform(-20, 20), min_val, max_val)
            sample[lever] = current_levers[lever]

        # Apply simple domain-informed rules for metric generation
        # CO2 Emissions: Reduced by EV, Solar, Public Transport, Trees. Increased by noise.
        co2 = baseline['co2_emissions'] \
              - (current_levers['ev_adoption_pct'] - baseline['ev_adoption_pct']) * 5 \
              - (current_levers['solar_adoption_pct'] - baseline['solar_adoption_pct']) * 3 \
              - (current_levers['public_transport_usage_pct'] - baseline['public_transport_usage_pct']) * 4 \
              - (current_levers['trees_planted_pct'] - baseline['trees_planted_pct']) * 2 \
              + np.random.normal(0, 20)
        co2 = max(100, co2) # Ensure CO2 doesn't go too low

        # AQI: Reduced by EV, Public Transport, Trees. Increased by noise.
        aqi = baseline['aqi'] \
              - (current_levers['ev_adoption_pct'] - baseline['ev_adoption_pct']) * 2 \
              - (current_levers['public_transport_usage_pct'] - baseline['public_transport_usage_pct']) * 1.5 \
              - (current_levers['trees_planted_pct'] - baseline['trees_planted_pct']) * 1 \
              + np.random.normal(0, 10)
        aqi = max(50, aqi) # Ensure AQI doesn't go too low

        # Electricity Demand: Reduced by Solar. Increased by EV (charging), noise.
        electricity = baseline['electricity_demand'] \
                      - (current_levers['solar_adoption_pct'] - baseline['solar_adoption_pct']) * 8 \
                      + (current_levers['ev_adoption_pct'] - baseline['ev_adoption_pct']) * 2 \
                      + np.random.normal(0, 30)
        electricity = max(200, electricity) # Ensure electricity demand doesn't go too low

        # Green Score: Composite of others, higher is better. Increased by positive levers.
        # Simplified calculation for green score based on levers, higher values are better
        green_score = baseline['green_score'] \
                      + (current_levers['ev_adoption_pct'] - baseline['ev_adoption_pct']) * 0.5 \
                      + (current_levers['solar_adoption_pct'] - baseline['solar_adoption_pct']) * 0.4 \
                      + (current_levers['trees_planted_pct'] - baseline['trees_planted_pct']) * 0.3 \
                      + (current_levers['plastic_recycling_pct'] - baseline['plastic_recycling_pct']) * 0.2 \
                      + (current_levers['public_transport_usage_pct'] - baseline['public_transport_usage_pct']) * 0.4 \
                      + np.random.normal(0, 5)
        green_score = np.clip(green_score, 0, 100) # Keep green score between 0 and 100

        sample.update({
            'co2_emissions': co2,
            'aqi': aqi,
            'electricity_demand': electricity,
            'green_score': green_score
        })
        data.append(sample)

    return pd.DataFrame(data)

if __name__ == '__main__':
    output_dir = '/home/ubuntu/ecopolicy-ai/data'
    os.makedirs(output_dir, exist_ok=True)

    all_data = pd.DataFrame()
    for city in cities:
        print(f'Generating synthetic data for {city}...')
        city_df = generate_synthetic_data(city)
        all_data = pd.concat([all_data, city_df], ignore_index=True)
        city_df.to_csv(os.path.join(output_dir, f'{city.lower()}_synthetic_data.csv'), index=False)

    print('All synthetic data generated and saved.')
    all_data.to_csv(os.path.join(output_dir, 'all_cities_synthetic_data.csv'), index=False)

