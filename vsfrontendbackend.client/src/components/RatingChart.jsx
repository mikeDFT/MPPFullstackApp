import React from 'react';
import { useData } from "@/context/DataContext";

export function RatingChart() {
	const { ratingDistribution } = useData().games;
	
	// calculate the maximum value for scaling
	const maxCount = Math.max(...Object.values(ratingDistribution), 1);
	
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
				{Object.entries(ratingDistribution).map(([range, count]) => (
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