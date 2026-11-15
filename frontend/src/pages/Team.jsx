import { Users } from 'lucide-react';

export default function Team() {
  const members = [
    { regNo: '23BCE20241', name: 'Arshiya Shaik' },
    { regNo: '23BCE9771', name: 'Ch Bharadwaj' },
    { regNo: '23BCE20281', name: 'K NAVA NEETH KUMAR REDDY' },
    { regNo: '23BCE7636', name: 'N Vasu' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-8 h-8 text-brand-teal flex-shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">
          Research Team
        </h1>
      </div>
      <p className="text-gray-600 mb-8">
        Undergraduate research project team members:
      </p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm text-left border-collapse" role="table">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="py-3.5 px-6 font-semibold text-gray-700" scope="col">Registration number</th>
              <th className="py-3.5 px-6 font-semibold text-gray-700" scope="col">Team member</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.regNo} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3.5 px-6 font-mono text-gray-600">{m.regNo}</td>
                <td className="py-3.5 px-6 font-medium text-gray-900">{m.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs sm:text-sm text-gray-500 italic">
        Official university/department details, project guide, academic year, and acknowledgements will be added after confirmation.
      </p>
    </div>
  );
}

