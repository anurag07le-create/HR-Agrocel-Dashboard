import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notificationData, setNotificationData] = useState(null);
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const triggerNotification = (data) => {
        if (data) {
            setNotificationData(data);
            setHasNewNotification(true);
        }
    };

    const openNotification = () => {
        if (hasNewNotification) {
            setShowModal(true);
            setHasNewNotification(false);
        }
    };

    const closeNotification = () => {
        setShowModal(false);
    };

    return (
        <NotificationContext.Provider value={{
            notificationData,
            hasNewNotification,
            showModal,
            triggerNotification,
            openNotification,
            closeNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
