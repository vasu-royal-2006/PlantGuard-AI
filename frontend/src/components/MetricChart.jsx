import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { MODEL_META, MODEL_ORDER } from '../constants';

/**
 * Reusable chart wrapper for model-based visualisations.
 *
 * Props:
 *   type: 'bar' | 'horizontalBar' | 'groupedBar' | 'multiLine'
 *   data: array of data points
 *   caption: optional string below the chart
 *   title: optional heading
 *   height: chart height (default 350)
 */
export default function MetricChart({ type, data, caption, title, height = 350 }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
      {title && <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart(type, data)}
      </ResponsiveContainer>
      {caption && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">{caption}</p>
      )}
    </div>
  );
}

function renderChart(type, data) {
  switch (type) {
    case 'horizontalBar':
      return (
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 12 }}
            width={90}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Accuracy']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
          />
          <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
            {data.map((entry) => {
              const meta = MODEL_META[entry.key];
              return (
                <rect key={entry.key} fill={meta?.color || '#6B7280'} />
              );
            })}
          </Bar>
        </BarChart>
      );

    case 'groupedBar':
      return (
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="strength" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
          <Tooltip
            formatter={(value, name) => {
              const meta = MODEL_META[name];
              return [`${Number(value).toFixed(2)}%`, meta?.label || name];
            }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
          />
          <Legend
            formatter={(value) => {
              const meta = MODEL_META[value];
              return meta?.label || value;
            }}
          />
          {MODEL_ORDER.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={MODEL_META[key].color}
              name={key}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      );

    case 'multiLine':
      return (
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="strength" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
          <Tooltip
            formatter={(value, name) => {
              const meta = MODEL_META[name];
              return [`${Number(value).toFixed(2)}%`, meta?.label || name];
            }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
          />
          <Legend
            formatter={(value) => {
              const meta = MODEL_META[value];
              return meta?.label || value;
            }}
          />
          {MODEL_ORDER.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={MODEL_META[key].color}
              name={key}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      );

    default:
      return (
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Value']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
          />
          <Bar dataKey="value" fill="#0F766E" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
  }
}
