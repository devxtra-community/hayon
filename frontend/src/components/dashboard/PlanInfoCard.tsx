'use client';

export default function PlanInfoCard() {
    return (
        <div className="bg-white rounded-2xl p-6 h-full flex flex-col justify-between">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Plan Info</h3>

            <div className="space-y-8">
                {/* Total Generations */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Total Generations Left</h4>
                    <div className="relative h-12 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        {/* Striped Background Pattern */}
                        <div className="absolute inset-0" style={{
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 20px)`
                        }} />

                        {/* Filled Part */}
                        <div className="absolute left-0 top-0 h-full bg-[#318D62] rounded-full flex items-center justify-center text-white font-medium text-sm z-10" style={{ width: '50%' }}>
                            5/10
                        </div>
                    </div>
                </div>

                {/* Total Posts */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Total Posts Left</h4>
                    <div className="relative h-12 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        {/* Striped Background Pattern */}
                        <div className="absolute inset-0" style={{
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 20px)`
                        }} />

                        {/* Filled Part */}
                        <div className="absolute left-0 top-0 h-full bg-[#318D62] rounded-full flex items-center justify-center text-white font-medium text-sm z-10" style={{ width: '15%' }}>
                            2/15
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 text-right">
                <span className="text-xs text-gray-400 font-medium">Free tier</span>
            </div>
        </div>
    );
}
