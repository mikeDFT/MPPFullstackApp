import React, { useEffect, useState } from 'react';
import { useData } from "@/context/DataContext";

export function RatingChart() {
	const { gamesInfo } = useData().games;

	// state for storing the processed data
	const [chartData, setChartData] = useState({
		"1-2": 0,
		"2-3": 0,
		"3-4": 0,
		"4-5": 0
	});
	
	// process data whenever gamesInfo changes
	useEffect(() => {
		if (!gamesInfo) return;
		
		// initialize counts
		const ratingCounts = {
			"1-2": 0,
			"2-3": 0,
			"3-4": 0,
			"4-5": 0
		};
		
		// count games in each rating interval
		gamesInfo.forEach(game => {
			const rating = game.Rating;
			
			if (rating < 2) {
				ratingCounts["1-2"]++;
			} else if (rating >= 2 && rating < 3) {
				ratingCounts["2-3"]++;
			} else if (rating >= 3 && rating < 4) {
				ratingCounts["3-4"]++;
			} else if (rating >= 4) {
				ratingCounts["4-5"]++;
			}
		});
		
		setChartData(ratingCounts);
	}, [gamesInfo]);
	
	// calculate the maximum value for scaling
	const maxCount = Math.max(...Object.values(chartData), 1);
	
	return (
		<div style={{
			backgroundColor: "#2f1f59",
			borderRadius: "1rem",
			border: "1px solid rgba(255, 255, 255, 0.5)",
			padding: "1.5rem",
			marginTop: "1.5rem",
			color: "white"
		}}>
			<h4>Game Ratings Distribution</h4>

			<div style={{padding:'2rem'}}/>
			<div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", height: "200px", alignItems: "flex-end" }}>
				{Object.entries(chartData).map(([range, count]) => (
					<div key={range} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
						<div 
							style={{ 
								width: "60%", 
								height: `${(count / maxCount) * 180}px`,
								backgroundColor: "#A6FF00",
								borderRadius: "0.5rem 0.5rem 0 0",
								transition: "height 0.3s ease",
								minHeight: count > 0 ? "20px" : "0"
							}}
						/>
						<div style={{ marginTop: "0.5rem", textAlign: "center" }}>
							<div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{range}</div>
							<div style={{ marginTop: "0.25rem" }}>{count}</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export default RatingChart; 