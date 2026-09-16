export interface CurrentWeatherData {
	temperature_2m: number;
	relative_humidity_2m: number;
	apparent_temperature: number;
	weather_code: number;
	is_day?: number;
	cloud_cover: number;
	pressure_msl?: number;
	surface_pressure?: number;
	wind_direction_10m: number;
	wind_speed_10m: number;
}

export interface DailyWeatherData {
	time: string[];
	temperature_2m_max: number[];
	temperature_2m_min: number[];
	weather_code: number[];
	sunrise: string[];
	sunset: string[];
	rain_sum: number[];
	uv_index_max: number[];
	precipitation_probability_max: number[];
}

export interface WeatherData {
	current: CurrentWeatherData;
	daily: DailyWeatherData;
	locationName: string;
	country?: string;
}
