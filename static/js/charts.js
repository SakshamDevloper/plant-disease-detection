// charts.js - Advanced charting module for PlantDoctor AI

class ChartManager {
    constructor() {
        this.charts = {};
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: this.getThemeColor(),
                        font: {
                            family: 'Plus Jakarta Sans'
                        }
                    }
                }
            }
        };
        
        this.init();
    }
    
    init() {
        this.createDiseaseDistributionChart();
        this.createAccuracyTrendChart();
        this.createPlantHealthChart();
        this.createSeasonalAnalysisChart();
        this.createTreatmentEffectivenessChart();
        
        // Listen for theme changes
        this.observeThemeChanges();
    }
    
    getThemeColor() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? '#e4e6eb' : '#2c3e50';
    }
    
    observeThemeChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    this.updateChartsTheme();
                }
            });
        });
        
        observer.observe(document.documentElement, { attributes: true });
    }
    
    updateChartsTheme() {
        const textColor = this.getThemeColor();
        
        Object.values(this.charts).forEach(chart => {
            if (chart.config.options.plugins.legend) {
                chart.config.options.plugins.legend.labels.color = textColor;
            }
            chart.update();
        });
    }
    
    createDiseaseDistributionChart() {
        const ctx = document.getElementById('diseaseChart')?.getContext('2d');
        if (!ctx) return;
        
        this.charts.disease = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Late Blight', 'Early Blight', 'Leaf Mold', 'Powdery Mildew', 'Healthy', 'Other'],
                datasets: [{
                    data: [28, 22, 15, 12, 18, 5],
                    backgroundColor: [
                        '#e74c3c',
                        '#f39c12',
                        '#3498db',
                        '#9b59b6',
                        '#2ecc71',
                        '#95a5a6'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                ...this.defaultOptions,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} cases (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    createAccuracyTrendChart() {
        const ctx = document.getElementById('accuracyChart')?.getContext('2d');
        if (!ctx) return;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(46, 204, 113, 0.4)');
        gradient.addColorStop(1, 'rgba(46, 204, 113, 0.0)');
        
        this.charts.accuracy = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Model Accuracy',
                    data: [88, 89, 90, 91, 92, 93, 94, 93, 95, 94, 95, 96],
                    borderColor: '#2ecc71',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#2ecc71',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 8
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 80,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Accuracy: ${context.parsed.y}%`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            targetLine: {
                                type: 'line',
                                yMin: 95,
                                yMax: 95,
                                borderColor: '#f39c12',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: 'Target: 95%',
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    createPlantHealthChart() {
        const ctx = document.getElementById('plantHealthChart')?.getContext('2d');
        if (!ctx) return;
        
        this.charts.plantHealth = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'Leaf Health',
                    'Growth Rate',
                    'Disease Resistance',
                    'Nutrient Level',
                    'Water Status',
                    'Overall Vigor'
                ],
                datasets: [{
                    label: 'Current Health',
                    data: [85, 78, 90, 82, 88, 85],
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: '#2ecc71',
                    borderWidth: 2,
                    pointBackgroundColor: '#2ecc71',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2
                }, {
                    label: 'Ideal Target',
                    data: [95, 90, 95, 90, 95, 95],
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderColor: '#3498db',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointBackgroundColor: '#3498db'
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }
    
    createSeasonalAnalysisChart() {
        const ctx = document.getElementById('seasonalChart')?.getContext('2d');
        if (!ctx) return;
        
        this.charts.seasonal = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Spring', 'Summer', 'Fall', 'Winter'],
                datasets: [{
                    label: 'Disease Occurrence',
                    data: [45, 78, 62, 28],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(231, 76, 60, 0.7)',
                        'rgba(241, 196, 15, 0.7)',
                        'rgba(52, 152, 219, 0.7)'
                    ],
                    borderColor: [
                        '#2ecc71',
                        '#e74c3c',
                        '#f1c40f',
                        '#3498db'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Cases'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                const season = context.label;
                                const tips = {
                                    'Spring': 'Increase monitoring frequency',
                                    'Summer': 'High risk - Apply preventive treatments',
                                    'Fall': 'Clean up fallen leaves',
                                    'Winter': 'Plan crop rotation'
                                };
                                return tips[season] || '';
                            }
                        }
                    }
                }
            }
        });
    }
    
    createTreatmentEffectivenessChart() {
        const ctx = document.getElementById('treatmentChart')?.getContext('2d');
        if (!ctx) return;
        
        this.charts.treatment = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                datasets: [{
                    label: 'Organic Treatment',
                    data: [100, 85, 70, 55, 40, 30],
                    borderColor: '#2ecc71',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4
                }, {
                    label: 'Chemical Treatment',
                    data: [100, 75, 50, 30, 15, 5],
                    borderColor: '#e74c3c',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4
                }, {
                    label: 'Combined Approach',
                    data: [100, 70, 40, 20, 10, 2],
                    borderColor: '#3498db',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Disease Severity (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Treatment Duration'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${context.parsed.y}% severity`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    createConfidenceGauge(confidence) {
        const ctx = document.getElementById('confidenceGauge')?.getContext('2d');
        if (!ctx) return;
        
        const color = this.getConfidenceColor(confidence);
        
        this.charts.confidence = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [confidence, 100 - confidence],
                    backgroundColor: [color, 'rgba(0, 0, 0, 0.1)'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '75%',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    tooltip: { enabled: false },
                    legend: { display: false }
                }
            }
        });
        
        return this.charts.confidence;
    }
    
    createSeverityRadar(severityData) {
        const ctx = document.getElementById('severityChart')?.getContext('2d');
        if (!ctx) return;
        
        this.charts.severity = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'Leaf Damage',
                    'Spread Risk',
                    'Treatment Urgency',
                    'Recovery Potential',
                    'Economic Impact'
                ],
                datasets: [{
                    label: 'Severity Assessment',
                    data: [
                        severityData.spot_density || 0,
                        (severityData.severity_score || 0) * 25,
                        (severityData.severity_score || 0) * 33,
                        100 - ((severityData.severity_score || 0) * 20),
                        severityData.leaf_area_percentage || 0
                    ],
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: '#2ecc71',
                    borderWidth: 2,
                    pointBackgroundColor: '#2ecc71'
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    getConfidenceColor(confidence) {
        if (confidence >= 90) return '#27ae60';
        if (confidence >= 75) return '#2ecc71';
        if (confidence >= 60) return '#f1c40f';
        if (confidence >= 40) return '#f39c12';
        return '#e74c3c';
    }
    
    updateDiseaseData(newData) {
        if (this.charts.disease) {
            this.charts.disease.data.datasets[0].data = newData;
            this.charts.disease.update();
        }
    }
    
    updateAccuracyData(newData) {
        if (this.charts.accuracy) {
            this.charts.accuracy.data.datasets[0].data = newData;
            this.charts.accuracy.update();
        }
    }
    
    addAccuracyAnnotation(value, label) {
        if (this.charts.accuracy) {
            this.charts.accuracy.options.plugins.annotation = {
                annotations: {
                    [label]: {
                        type: 'line',
                        yMin: value,
                        yMax: value,
                        borderColor: '#f39c12',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                            content: label,
                            enabled: true
                        }
                    }
                }
            };
            this.charts.accuracy.update();
        }
    }
    
    exportChart(chartName, format = 'png') {
        const chart = this.charts[chartName];
        if (!chart) return null;
        
        const canvas = chart.canvas;
        return canvas.toDataURL(`image/${format}`);
    }
    
    downloadChart(chartName, filename = 'chart.png') {
        const dataUrl = this.exportChart(chartName);
        if (!dataUrl) return;
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }
    
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            chart.resize();
        });
    }
    
    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            delete this.charts[chartName];
        }
    }
    
    destroyAllCharts() {
        Object.keys(this.charts).forEach(name => {
            this.destroyChart(name);
        });
    }
}

// Analytics Dashboard
class AnalyticsDashboard {
    constructor(chartManager) {
        this.chartManager = chartManager;
        this.data = {
            diseases: [],
            accuracy: [],
            seasonal: [],
            treatments: []
        };
        
        this.init();
    }
    
    async init() {
        await this.loadAnalyticsData();
        this.setupEventListeners();
        this.startPeriodicUpdates();
    }
    
    async loadAnalyticsData() {
        try {
            const response = await fetch('/api/analytics');
            const data = await response.json();
            
            this.data = data;
            this.updateDashboard();
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.loadMockData();
        }
    }
    
    loadMockData() {
        // Mock data for demonstration
        this.data = {
            diseases: [28, 22, 15, 12, 18, 5],
            accuracy: [88, 89, 90, 91, 92, 93, 94, 93, 95, 94, 95, 96],
            seasonal: [45, 78, 62, 28],
            treatments: {
                organic: [100, 85, 70, 55, 40, 30],
                chemical: [100, 75, 50, 30, 15, 5],
                combined: [100, 70, 40, 20, 10, 2]
            }
        };
        
        this.updateDashboard();
    }
    
    updateDashboard() {
        // Update charts with loaded data
        if (this.chartManager.charts.disease) {
            this.chartManager.charts.disease.data.datasets[0].data = this.data.diseases;
            this.chartManager.charts.disease.update();
        }
        
        if (this.chartManager.charts.accuracy) {
            this.chartManager.charts.accuracy.data.datasets[0].data = this.data.accuracy;
            this.chartManager.charts.accuracy.update();
        }
        
        // Update statistics
        this.updateStatistics();
    }
    
    updateStatistics() {
        // Calculate and display statistics
        const totalAnalyses = this.data.accuracy.length * 10; // Mock calculation
        const avgAccuracy = this.data.accuracy.reduce((a, b) => a + b, 0) / this.data.accuracy.length;
        const improvement = this.data.accuracy[this.data.accuracy.length - 1] - this.data.accuracy[0];
        
        document.getElementById('totalAnalyses').textContent = totalAnalyses;
        document.getElementById('avgAccuracy').textContent = `${avgAccuracy.toFixed(1)}%`;
        document.getElementById('improvement').textContent = `${improvement > 0 ? '+' : ''}${improvement}%`;
    }
    
    setupEventListeners() {
        // Time range filters
        document.querySelectorAll('.chart-period').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTimeRange(e.target.textContent.toLowerCase());
            });
        });
        
        // Export buttons
        document.getElementById('exportDiseaseChart')?.addEventListener('click', () => {
            this.chartManager.downloadChart('disease', 'disease-distribution.png');
        });
        
        document.getElementById('exportAccuracyChart')?.addEventListener('click', () => {
            this.chartManager.downloadChart('accuracy', 'accuracy-trend.png');
        });
    }
    
    changeTimeRange(range) {
        // Filter data based on time range
        console.log(`Changing time range to: ${range}`);
        
        // Update chart data based on range
        // This would typically fetch new data from the server
    }
    
    startPeriodicUpdates() {
        // Update data every 5 minutes
        setInterval(() => {
            this.loadAnalyticsData();
        }, 300000);
    }
    
    generateReport() {
        const report = {
            generated: new Date().toISOString(),
            statistics: {
                totalAnalyses: document.getElementById('totalAnalyses')?.textContent,
                averageAccuracy: document.getElementById('avgAccuracy')?.textContent,
                improvement: document.getElementById('improvement')?.textContent
            },
            charts: {
                diseaseDistribution: this.chartManager.exportChart('disease'),
                accuracyTrend: this.chartManager.exportChart('accuracy'),
                seasonalAnalysis: this.chartManager.exportChart('seasonal'),
                treatmentEffectiveness: this.chartManager.exportChart('treatment')
            }
        };
        
        return report;
    }
}

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chartManager = new ChartManager();
    window.analyticsDashboard = new AnalyticsDashboard(window.chartManager);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        window.chartManager?.resizeCharts();
    });
});