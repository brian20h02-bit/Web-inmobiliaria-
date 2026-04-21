import { motion } from 'framer-motion'

interface SectionTitleProps {
  title: string
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return (
    <div className="section-heading-wrap">
      <motion.span
        className="section-heading-bar"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ transformOrigin: 'top', display: 'block' }}
      />
      <motion.h2
        className="section-heading"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      >
        {title}
      </motion.h2>
    </div>
  )
}
