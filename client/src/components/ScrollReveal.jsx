import { motion } from "framer-motion";

export const ScrollReveal = ({
  children,
  direction = "up",
  delay = 0,
  duration = 0.55,
  className = "",
  amount = 0.12,
  once = true,
}) => {
  const getInitial = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 45 };
      case "down":
        return { opacity: 0, y: -45 };
      case "left":
        return { opacity: 0, x: 45 };
      case "right":
        return { opacity: 0, x: -45 };
      case "scale":
        return { opacity: 0, scale: 0.92, y: 25 };
      case "fade":
      default:
        return { opacity: 0 };
    }
  };

  const getAnimate = () => {
    switch (direction) {
      case "up":
      case "down":
        return { opacity: 1, y: 0 };
      case "left":
      case "right":
        return { opacity: 1, x: 0 };
      case "scale":
        return { opacity: 1, scale: 1, y: 0 };
      case "fade":
      default:
        return { opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={getAnimate()}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScrollRevealStagger = ({
  children,
  staggerDelay = 0.1,
  className = "",
  amount = 0.1,
  once = true,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.05,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScrollRevealItem = ({
  children,
  className = "",
  yOffset = 35,
  duration = 0.5,
}) => {
  const itemVariants = {
    hidden: { opacity: 0, y: yOffset, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
