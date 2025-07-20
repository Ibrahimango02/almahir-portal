import React from "react";

interface InvoicePaymentStatusBadgeProps {
    status: string;
    className?: string;
}

export const InvoicePaymentStatusBadge: React.FC<InvoicePaymentStatusBadgeProps> = ({ status, className }) => {
    let colorClass = "bg-gray-100 text-gray-800";
    if (status === "paid") colorClass = "bg-green-100 text-green-800";
    else if (status === "pending") colorClass = "bg-yellow-100 text-yellow-800";
    else if (status === "overdue") colorClass = "bg-red-100 text-red-800";

    return (
        <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colorClass} ${className || ""}`.trim()}
        >
            {status}
        </span>
    );
}; 