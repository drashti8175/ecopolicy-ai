# EcoPolicy AI Presentation Deck

## Slide 1: Title Slide
- **Title**: EcoPolicy AI: Urban Sustainability Simulation Framework
- **Subtitle**: Empowering City Planners with Instant ML-Driven Policy Insights
- **Author**: Manus AI

## Slide 2: The Problem
- Rapid urbanization in Indian metropolitan areas (e.g., Delhi, Ahmedabad, Surat) has led to severe air pollution (high AQI), rising carbon emissions, and overstretched electricity grids.
- Traditional policy planning relies on static, disconnected spreadsheets that fail to capture the complex, non-linear interactions between policy levers (EV adoption, solar transition, green cover) and environmental outcomes.
- Stakeholders lack an accessible tool to instantly simulate and compare multi-variable intervention scenarios before committing public funds.

## Slide 3: The Solution
- EcoPolicy AI is an interactive, full-stack policy simulation platform designed specifically for urban planners and environmental analysts.
- Features a real-time simulation engine powered by trained regression models across 5 core policy levers and 4 key output metrics.
- Integrates advanced AI explanations (gpt-5-mini) and comprehensive side-by-side scenario comparisons to drive data-backed decision-making.

## Slide 4: System Architecture
- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui, and Recharts for rich, responsive data visualization.
- **Backend**: Express, tRPC, and Python-trained Scikit-Learn Random Forest models running via a robust API layer.
- **AI & Reporting**: Manus Built-in Forge API for contextual LLM insights and `pdf-lib` for instant executive report generation.

## Slide 5: Live Demo & Core Workflow
- **City Selection**: Choose between Delhi, Ahmedabad, and Surat with pre-loaded baseline environmental data.
- **Interactive Levers**: Fine-tune 5 sliders (EV Adoption, Solar Adoption, Trees Planted, Plastic Recycling, Public Transport Usage).
- **Instant Simulation**: View predicted metrics against baselines with directional delta indicators, interactive charts, and AI policy recommendations.

## Slide 6: Alignment with UN Sustainable Development Goals (SDGs)
- **SDG 7 (Affordable and Clean Energy)**: Direct modeling of rooftop solar adoption and its stabilizing effect on urban electricity demand.
- **SDG 11 (Sustainable Cities and Communities)**: Equipping municipal planners with tools to optimize public transit, waste recycling, and green cover.
- **SDG 13 (Climate Action)**: Quantifiable tracking and reduction of urban CO₂ emissions and particulate air pollution (AQI).

## Slide 7: Results & Impact
- Successfully trained and deployed lightweight regression models achieving robust predictive performance ($R^2 > 0.65$).
- Delivered an end-to-end web application with zero-latency client-server communication via tRPC.
- Empowering cities to transition from reactive environmental management to proactive, data-driven climate resilience.
