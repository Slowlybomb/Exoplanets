import PropTypes from "prop-types";
import {
  LineChart,
  Line,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts";

const tooltipStyle = {
  background: "rgba(10, 18, 38, 0.85)",
  border: "1px solid rgba(103, 157, 255, 0.35)",
  borderRadius: "12px",
  padding: "0.75rem 1rem",
  color: "#e4eeff"
};

export function LightCurveChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 20, bottom: 8, left: 0 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67c9ff" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#7b4dff" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="rgba(124, 180, 255, 0.12)"
          vertical={false}
          strokeDasharray="4 8"
        />
        <XAxis
          dataKey="timestamp"
          stroke="rgba(228, 238, 255, 0.6)"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
        />
        <YAxis
          stroke="rgba(228, 238, 255, 0.6)"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          domain={[80, 100]}
          unit="%"
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "rgba(163, 214, 255, 0.75)", fontSize: "0.75rem" }}
          formatter={(value) => [`${value}%`, "Flux Intensity"]}
        />
        <Line
          type="monotone"
          dataKey="intensity"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          dot={{ r: 4, stroke: "#101b3a", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

LightCurveChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.string.isRequired,
      intensity: PropTypes.number.isRequired
    })
  ).isRequired
};
