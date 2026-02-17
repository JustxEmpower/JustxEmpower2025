CREATE TABLE IF NOT EXISTS admin_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('order','payment','shipment','refund','dispute','event_registration','low_stock','system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500),
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium' NOT NULL,
  `read` INT DEFAULT 0 NOT NULL,
  dismissed INT DEFAULT 0 NOT NULL,
  relatedId INT,
  relatedType VARCHAR(50),
  metadata TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
