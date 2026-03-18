import React from "react";
import { motion } from "framer-motion";

export const Switch = React.memo(({
    width = "",
    height = "",
    isSwitchTrue,
    setSwitchTrue,
    activeColor = "",
    inActiveColor = "",
    circleClassName = "w-8 h-8",
}) => {
    return (
        <div
            onClick={setSwitchTrue}
            className={`
                    ${width}
                    ${height}
                    ${isSwitchTrue ? activeColor : inActiveColor}
                    ${isSwitchTrue ? "justify-end" : "justify-start"}
                    px-1 flex cursor-pointer items-center rounded-full
                    border-2 ${isSwitchTrue ? "border-[var(--accent)]" : "border-(--border)"}
                    transition-colors duration-200
                `}
        >
            <motion.div
                layout
                className={`${circleClassName} ${
                  isSwitchTrue ? "bg-white" : "bg-[var(--surface)]"
                } rounded-full border ${isSwitchTrue ? "border-white" : "border-(--border)"}`}
                transition={{ duration: 0.15, ease: "easeInOut", type: "just" }}
            ></motion.div>
        </div>
    );
});

Switch.displayName = "Switch";