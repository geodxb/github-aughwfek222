import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

const Card = ({ children, title, className = '', onClick }: CardProps) => {
  return (
    <motion.div
      whileHover={onClick ? { y: -1 } : {}}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className={title ? "p-4" : "p-4"}>{children}</div>
    </motion.div>
  );
};

export default Card;