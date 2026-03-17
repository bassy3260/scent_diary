import { motion } from 'motion/react';

interface AccordChartProps {
  accords: { name: string; percentage: number; color: string }[];
}

export function AccordChart({ accords }: AccordChartProps) {
  return (
    <div className="space-y-3">
      {accords.map((accord, i) => (
        <motion.div
          key={accord.name}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <span className="w-16 text-right text-[#8A8680]" style={{ fontSize: '0.8125rem' }}>
            {accord.name}
          </span>
          <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: `${accord.color}10` }}>
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: `linear-gradient(90deg, ${accord.color}30, ${accord.color}60)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${accord.percentage}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1A1A1A]"
                style={{ fontSize: '0.6875rem', fontWeight: 500 }}>
                {accord.percentage}%
              </span>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
