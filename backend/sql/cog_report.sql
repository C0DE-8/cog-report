-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 01, 2026 at 06:34 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cog_report`
--

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `overseer` varchar(150) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `groups`
--

INSERT INTO `groups` (`id`, `name`, `overseer`, `created_at`) VALUES
(1, 'GROUP 1', 'RUKEVWE', '2026-05-01 15:03:23'),
(2, 'GROUP 2', 'RUKEVWE 2', '2026-05-01 16:15:13'),
(3, 'GROUP 3', 'RUKEVWE 3', '2026-05-01 16:15:26');

-- --------------------------------------------------------

--
-- Table structure for table `monthly_reports`
--

CREATE TABLE `monthly_reports` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `report_month` char(7) NOT NULL,
  `is_present` tinyint(1) NOT NULL DEFAULT 0,
  `hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `bible_studies` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `monthly_reports`
--

INSERT INTO `monthly_reports` (`id`, `user_id`, `report_month`, `is_present`, `hours`, `bible_studies`, `created_at`, `updated_at`) VALUES
(1, 1, '2023-04', 1, 1.00, 1, '2026-05-01 16:00:01', '2026-05-01 16:34:07');

-- --------------------------------------------------------

--
-- Table structure for table `monthly_report_entries`
--

CREATE TABLE `monthly_report_entries` (
  `id` int(11) NOT NULL,
  `monthly_report_id` int(11) NOT NULL,
  `hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `bible_studies` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `monthly_report_entries`
--

INSERT INTO `monthly_report_entries` (`id`, `monthly_report_id`, `hours`, `bible_studies`, `created_at`) VALUES
(1, 1, 1.00, 1, '2026-05-01 16:00:01');

-- --------------------------------------------------------

--
-- Table structure for table `publisher_statuses`
--

CREATE TABLE `publisher_statuses` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `publisher_statuses`
--

INSERT INTO `publisher_statuses` (`id`, `name`, `created_at`) VALUES
(1, 'Pioneer', '2026-05-01 15:30:05'),
(2, 'Aux Pioneer', '2026-05-01 15:30:05'),
(3, 'Other', '2026-05-01 15:30:05');

-- --------------------------------------------------------

--
-- Table structure for table `report_users`
--

CREATE TABLE `report_users` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `status` enum('Pioneer','Aux Pioneer','Other') NOT NULL DEFAULT 'Other',
  `status_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `report_users`
--

INSERT INTO `report_users` (`id`, `group_id`, `name`, `status`, `status_id`, `created_at`) VALUES
(1, 1, 'RUKEVWE', 'Pioneer', 1, '2026-05-01 15:31:23'),
(2, 1, 'sam light', 'Pioneer', 1, '2026-05-01 16:14:50'),
(3, 2, 'mark', 'Aux Pioneer', 2, '2026-05-01 16:15:39'),
(4, 3, 'luck', 'Other', 3, '2026-05-01 16:15:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`) VALUES
(2, 'Sam', '8amlight@gmail.com', '$2a$10$coCB6kV1.t/lb4zfRyu//u5T5EG0WjOr.VPvrCHKteO6d2G2HvsqC', '2026-05-01 14:26:45');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `monthly_reports`
--
ALTER TABLE `monthly_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_month` (`user_id`,`report_month`);

--
-- Indexes for table `monthly_report_entries`
--
ALTER TABLE `monthly_report_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_monthly_report_entries_report` (`monthly_report_id`);

--
-- Indexes for table `publisher_statuses`
--
ALTER TABLE `publisher_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `report_users`
--
ALTER TABLE `report_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_report_users_group` (`group_id`),
  ADD KEY `idx_report_users_status_id` (`status_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `monthly_reports`
--
ALTER TABLE `monthly_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `monthly_report_entries`
--
ALTER TABLE `monthly_report_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `publisher_statuses`
--
ALTER TABLE `publisher_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `report_users`
--
ALTER TABLE `report_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `monthly_reports`
--
ALTER TABLE `monthly_reports`
  ADD CONSTRAINT `fk_monthly_reports_user` FOREIGN KEY (`user_id`) REFERENCES `report_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `monthly_report_entries`
--
ALTER TABLE `monthly_report_entries`
  ADD CONSTRAINT `fk_monthly_report_entries_report` FOREIGN KEY (`monthly_report_id`) REFERENCES `monthly_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `report_users`
--
ALTER TABLE `report_users`
  ADD CONSTRAINT `fk_report_users_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_users_status` FOREIGN KEY (`status_id`) REFERENCES `publisher_statuses` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
