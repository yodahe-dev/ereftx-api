-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: ereftx
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_name_deleted_at` (`name`,`deletedAt`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `brands_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES ('00063c56-3234-4599-bdd9-20f7db8debf4','miranda (ሚሪንዳ)','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-01 18:54:47','2026-05-01 18:54:47',NULL),('099abdc3-aa28-46f4-a025-cbcd953e2666','guder wine (ጉደር ወይን)','d5ffefb9-4a17-4ea4-8f8d-83a04f213f20','2026-05-03 12:44:55','2026-05-03 12:44:55',NULL),('09a82833-e6f7-488b-ad62-ad3a7bd69e62','habesha beer (ሀበሻ ቢራ)','1986acd7-c2af-4381-b1f0-5c19da7b99e3','2026-05-01 18:38:28','2026-05-03 02:51:54',NULL),('1027188b-d723-4bac-8939-289de45f55f6','ambo mineral water bottle (አምቦ የማዕድን ውሃ)','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-03 12:30:42','2026-05-03 12:30:42',NULL),('1356bbba-097f-41c1-8d61-605c2c8c76da','ouzo beherawi liquor (ኡዞ ብሔራዊ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:13:10','2026-05-01 19:50:34',NULL),('19b3350a-26b3-4c57-90e0-454242bdbb9e','coca (ኮካ)','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-01 18:56:03','2026-05-01 18:56:03',NULL),('295cc109-2069-4d2d-bc37-1b3a5ecf3d8a','apretif beherawi liquor (አፕሬቲቭ ብሔራዊ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:09:21','2026-05-01 19:49:59',NULL),('2efde67b-5c93-4d10-bf74-6c8c83c9167f','7up','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-01 18:55:04','2026-05-01 18:55:04',NULL),('2f2fc683-bc4d-45f7-9745-1c75552ef2e4','harar beer (ሀረር ቢራ)','1986acd7-c2af-4381-b1f0-5c19da7b99e3','2026-05-01 18:46:16','2026-05-01 18:46:16',NULL),('415335de-b2fe-49b7-8d77-6b0936b89dd3','schweppes soft drink bottle (ሽዌፕስ ለስላሳ መጠጥ)','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-03 12:34:39','2026-05-03 12:34:39',NULL),('48a20ee3-8a4c-4a10-b10f-0d825580fc00','kemila wine (ከሚላ ወይን)','d5ffefb9-4a17-4ea4-8f8d-83a04f213f20','2026-05-03 12:45:33','2026-05-03 12:45:33',NULL),('4a778a67-1da2-4aff-ab0c-e7ed073c6635','axumite wine (አክሱማይት ወይን)','d5ffefb9-4a17-4ea4-8f8d-83a04f213f20','2026-05-03 12:45:45','2026-05-03 12:45:45',NULL),('509725a9-20ad-45db-9065-b491a66be67c','spearmint beherawi liquor (ሱፐርሜንት ብሔራዊ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:15:05','2026-05-01 19:50:54',NULL),('5d616df3-eb1c-435a-af76-3e26cc1a4a60','fanta orange (ፋንታ ኦሬንጅ)','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-01 18:57:00','2026-05-01 18:57:00',NULL),('6bbd5ab8-5587-4b50-a4d3-4bafdfd6ccfb','fanta ananas (ፋንታ አናናስ)','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-01 18:57:44','2026-05-01 18:57:44',NULL),('6bdbd317-d6f4-4d48-add3-eeab3fabfae4','codgnac viv liquor (ኮኛክ ቪቭ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:49:17','2026-05-01 19:49:17',NULL),('82be94ab-8816-48dd-9fb4-e66d6adfc79c','senq malt (ስንቅ ማልት)','99d5abc8-5a31-408c-b589-db7fda26b45e','2026-05-01 18:41:58','2026-05-01 18:44:24',NULL),('83aa8af8-14e3-421f-ae09-6b63523111f5','sofi malt (ሶፊ ማልት)','99d5abc8-5a31-408c-b589-db7fda26b45e','2026-05-01 18:43:09','2026-05-01 18:44:46',NULL),('855e1ed0-f4d7-4deb-9b07-cd0ec1c42838','apple arada hard seltzer (አራዳ አፕል )','1986acd7-c2af-4381-b1f0-5c19da7b99e3','2026-05-01 18:50:05','2026-05-01 18:51:04',NULL),('87ca61fe-2e1f-45c4-a5b7-8d169485130b','dashen beer (ዳሽን ቢራ)','1986acd7-c2af-4381-b1f0-5c19da7b99e3','2026-05-01 18:36:41','2026-05-01 18:36:41',NULL),('8aeab64d-d673-4d3b-8c19-c51c9dadb8b5','awash wine (አዋሽ ወይን)','d5ffefb9-4a17-4ea4-8f8d-83a04f213f20','2026-05-03 12:45:19','2026-05-03 12:45:19',NULL),('8dd42ff3-e056-4a0d-bb5f-6b12d1aa9866','bedele beer (በደሌ)','1986acd7-c2af-4381-b1f0-5c19da7b99e3','2026-05-01 18:47:03','2026-05-01 18:47:03',NULL),('91af032a-b8f3-4aed-bd8a-fd50b0bbf4f4','fernet beherawi liqueur  (ፈርኒጥ ብሔራዊ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:40:59','2026-05-01 19:50:27',NULL),('91ec334b-2b44-4031-be5f-85fa615a4bc8','peach beherawi liquor (ኮክ ብሔራዊ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:44:55','2026-05-01 19:50:39',NULL),('95a2c524-794a-4ff2-bd1c-cf8ea02e4862','apretif viv liquor (አፕሬቲቭ ቪቭ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:48:08','2026-05-01 19:50:14',NULL),('9bdca5fb-6e85-49b0-bcb2-94b3972aeb2d','lime  arada hard seltzer (ሎሚ አራዳ)','1986acd7-c2af-4381-b1f0-5c19da7b99e3','2026-05-01 18:51:51','2026-05-01 18:51:51',NULL),('a0290a59-79fa-4a9f-bb51-3dea77b18861','fernet viv liqueur (መራራ ቪቭ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:52:01','2026-05-01 19:53:11',NULL),('a72a1236-0a4c-4648-9705-5f4a7b305872','gin beherawi liquor (ጂን ብሔራዊ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:06:43','2026-05-01 19:49:54',NULL),('b2a9983d-874f-4a5f-8f54-2f3780b952cb','sprite (ስፕራየት)','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-01 19:04:42','2026-05-01 19:04:42',NULL),('b3e9f832-3fc2-45f2-851d-be997687cac1','st george beer (ቅዱስ ጊዮርጊስ ቢራ)','1986acd7-c2af-4381-b1f0-5c19da7b99e3','2026-05-01 18:37:27','2026-05-01 18:43:35',NULL),('ce019788-0b51-4d49-a874-f249ad0caa55','pineapple beherawi liqueur (አናናስ ብሔራዊ አረቄ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:42:06','2026-05-01 19:50:47',NULL),('d924dfcf-1318-4acd-9246-db959183f429','pepsi soft drink bottle (ፔፕሲ ለስላሳ መጠጥ ቦታል)','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-03 12:33:06','2026-05-03 12:33:06',NULL),('ec2d29a3-4703-4a8f-9aff-0d5e99162935','pineapple arada hard seltzer(ማንጎ አራዳ)','1986acd7-c2af-4381-b1f0-5c19da7b99e3','2026-05-01 18:53:05','2026-05-01 18:53:05',NULL),('ee950722-bcbc-4237-8ad9-58b306bdfd7b','negus malt (ንጉስ ማልት)','99d5abc8-5a31-408c-b589-db7fda26b45e','2026-05-01 18:41:25','2026-05-01 18:44:37',NULL),('fa2191e3-ccc4-49e8-a544-4ee405a8f6a9','codgnac liquor beherawi(ኮኛክ ብሔራዊ)','782fe550-f37f-40d5-beb8-79be15eadb92','2026-05-01 19:42:33','2026-05-01 19:50:20',NULL),('fa9bb1f9-dae9-49b7-97c5-ac980016c1b2','novida soft drink bottle (ኖቪዳ መጠጥ)','1558c06e-d035-4706-abc3-cce5f7293bb9','2026-05-03 12:35:58','2026-05-03 12:35:58',NULL);
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `categories_name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `name_20` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('1558c06e-d035-4706-abc3-cce5f7293bb9','softdrink(ለስላሳ)','2026-05-01 18:34:25','2026-05-01 18:34:25'),('1986acd7-c2af-4381-b1f0-5c19da7b99e3','alcohol (የአልኮል)','2026-05-01 18:32:47','2026-05-01 18:35:26'),('782fe550-f37f-40d5-beb8-79be15eadb92','liquor(አረቄ)','2026-05-01 18:33:26','2026-05-01 18:33:26'),('99d5abc8-5a31-408c-b589-db7fda26b45e','malt (ማልት)','2026-05-01 18:40:46','2026-05-01 18:40:46'),('d5ffefb9-4a17-4ea4-8f8d-83a04f213f20','wine (ወይን)','2026-05-01 18:32:53','2026-05-01 18:34:00');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exchanges`
--

DROP TABLE IF EXISTS `exchanges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exchanges` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `sourceProductId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `targetProductId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `sourcePriceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `targetPriceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `sourceQuantity` int NOT NULL,
  `targetQuantity` int NOT NULL,
  `exchangeType` enum('box','single') NOT NULL,
  `balanceAmount` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Financial difference between source and target total value',
  `notes` text,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sourceProductId` (`sourceProductId`),
  KEY `targetProductId` (`targetProductId`),
  KEY `sourcePriceId` (`sourcePriceId`),
  KEY `targetPriceId` (`targetPriceId`),
  CONSTRAINT `exchanges_ibfk_21` FOREIGN KEY (`sourceProductId`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `exchanges_ibfk_22` FOREIGN KEY (`targetProductId`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `exchanges_ibfk_23` FOREIGN KEY (`sourcePriceId`) REFERENCES `product_prices` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `exchanges_ibfk_24` FOREIGN KEY (`targetPriceId`) REFERENCES `product_prices` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchanges`
--

LOCK TABLES `exchanges` WRITE;
/*!40000 ALTER TABLE `exchanges` DISABLE KEYS */;
/*!40000 ALTER TABLE `exchanges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packagings`
--

DROP TABLE IF EXISTS `packagings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `packagings` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`),
  UNIQUE KEY `type_2` (`type`),
  UNIQUE KEY `type_3` (`type`),
  UNIQUE KEY `type_4` (`type`),
  UNIQUE KEY `type_5` (`type`),
  UNIQUE KEY `type_6` (`type`),
  UNIQUE KEY `type_7` (`type`),
  UNIQUE KEY `type_8` (`type`),
  UNIQUE KEY `type_9` (`type`),
  UNIQUE KEY `type_10` (`type`),
  UNIQUE KEY `type_11` (`type`),
  UNIQUE KEY `packagings_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packagings`
--

LOCK TABLES `packagings` WRITE;
/*!40000 ALTER TABLE `packagings` DISABLE KEYS */;
INSERT INTO `packagings` VALUES ('870ec685-2ecb-41cb-afd8-0d0779cafdb7','Standard','2026-05-05 09:02:48','2026-05-05 09:02:48','Bottle');
/*!40000 ALTER TABLE `packagings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_prices`
--

DROP TABLE IF EXISTS `product_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_prices` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `buyPricePerBox` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sellPricePerBox` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sellPricePerUnit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `startAt` datetime NOT NULL,
  `endAt` datetime DEFAULT NULL,
  `allowLoss` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `productId` (`productId`),
  CONSTRAINT `product_prices_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_prices`
--

LOCK TABLES `product_prices` WRITE;
/*!40000 ALTER TABLE `product_prices` DISABLE KEYS */;
INSERT INTO `product_prices` VALUES ('003b0849-73a8-4b37-938f-ea6a099db371','58acfec9-6f88-46e8-9ecf-e35acdb6d62a',9375.00,12000.00,800.00,'2026-05-03 10:47:26',NULL,1),('01980a21-0f94-46e4-8fdf-1ca9e8b2fd84','8731ffa6-3ecd-481c-ad63-11005e89c6b6',5250.00,9000.00,600.00,'2026-05-03 12:48:21',NULL,1),('114e20da-bf6b-4cd5-a1a4-838422320294','7c163118-6585-4743-8085-0a10924cedb6',5250.00,9000.00,600.00,'2026-05-03 12:48:22',NULL,1),('180a9eb5-2a85-4382-abcd-ff7ef07118cc','0018a942-b12f-46a4-a54b-d06a664c6034',670.00,750.00,40.00,'2026-05-03 12:37:51',NULL,1),('2a0192b1-f4f2-406d-9bfe-6976ad26d031','e758892d-3c02-4cac-a557-0e2f22c062b3',9375.00,1200.00,800.00,'2026-05-03 03:00:10',NULL,1),('30d5a774-8d46-44c1-b7dc-fe1850875cc4','4dbe5109-ad6d-49fa-a7d1-a9042a435ec9',1600.00,1700.00,80.00,'2026-05-03 01:48:05',NULL,1),('36df50ba-52b1-49ea-ae4d-fe9e9c87fc0a','30d17234-3145-4541-a247-7010392ad697',1980.00,2100.00,100.00,'2026-05-03 10:44:49',NULL,1),('3d9b55e1-c456-4fa6-9b52-89b1dd063186','c2c5dfa1-8fb0-40a2-ab06-3452f8d75126',1600.00,1700.00,80.00,'2026-05-03 01:56:13',NULL,1),('4ae5c82c-dd41-4c33-9055-29b222ceee1f','9885518c-bd98-4a72-9dc8-263d255a3b66',9375.00,1200.00,800.00,'2026-05-03 03:00:10',NULL,1),('4b6b6078-74b6-4d5d-bc8e-69ef86f2e165','9efea2d7-e404-4a87-bbc8-0eff65474d80',9375.00,12000.00,800.00,'2026-05-03 10:47:27',NULL,1),('524c17c2-35dd-4d28-9fb6-e60ae51c5032','6961ed8a-1814-4ddb-b659-9e965b2ece3a',670.00,750.00,40.00,'2026-05-03 02:49:22',NULL,1),('6595e2b5-e108-41d5-a021-17ac5ce0bae1','3cf656d7-a126-4b24-84cf-3f1ff8493139',1400.00,1500.00,70.00,'2026-05-03 02:46:44',NULL,1),('65ec8c3b-6798-41fe-8463-1875eec01a0c','11026b4e-8280-4b68-8795-3591d7921877',670.00,750.00,40.00,'2026-05-03 01:18:20',NULL,1),('6ef940e3-0a5d-4602-990c-526f8a26373e','94847c8a-bef2-4bda-950d-29c9da4db451',9375.00,1200.00,800.00,'2026-05-03 03:00:08',NULL,1),('6f0b4be4-5214-4e68-bf66-157546bc8192','b3977710-ee1d-45f8-8c14-0df35ac3bfa4',670.00,750.00,40.00,'2026-05-03 02:49:23',NULL,1),('75134a9e-2fcb-4cbf-822f-48fcfd01bc66','6821e100-de18-4e54-a453-b3d55b71da14',9900.00,12750.00,850.00,'2026-05-03 10:54:00',NULL,1),('775792a5-abed-47b4-871b-44a6f35b8d8c','56c8ad82-23fc-42ea-b399-f5d638d38ea8',1600.00,1700.00,80.00,'2026-05-03 02:50:31',NULL,1),('7bd4c18d-834f-42f7-a5a5-bb4565c5c678','0049e301-c00f-4dc1-b4fd-7d1a60b1336d',670.00,750.00,40.00,'2026-05-03 12:37:51',NULL,1),('83b63870-6a4b-410f-8321-42749e87f2d1','5fad45ea-ccab-448f-b18d-bca7090693e7',1400.00,1500.00,70.00,'2026-05-03 02:46:44',NULL,1),('87f37a72-bc07-43a4-8a55-191143fb21ad','599de83f-4567-406c-8fd5-53b094fad71c',9375.00,12000.00,800.00,'2026-05-03 10:47:27',NULL,1),('89a514de-4f61-4198-b47d-689c7b4878f5','1f842d62-90ec-48a1-b838-3fcc9bede87a',670.00,750.00,40.00,'2026-05-03 02:49:23',NULL,1),('91e78918-fd38-4fe4-86fc-cf30f3706a0e','8d6ddad3-3c66-4ded-b99c-7c9f69b26380',9375.00,1200.00,800.00,'2026-05-03 03:00:09',NULL,1),('9f5ee574-f91d-4d10-a2b1-31510c785676','d5463f96-3e2e-4320-889e-60022defa296',670.00,750.00,40.00,'2026-05-03 12:37:51',NULL,1),('af111939-18a3-446b-8a5f-4e99ad46f710','b67db8e4-0fcf-46ec-841d-f232f9f66581',9375.00,1200.00,800.00,'2026-05-03 03:00:09',NULL,1),('b6cf864a-2adb-47a7-a5a8-db0010e3532b','25bd78f1-9503-41fe-8861-caf6e2188341',630.00,750.00,50.00,'2026-05-03 12:38:23',NULL,1),('bbe32bbe-822d-4055-997c-ce291153f488','2b08003d-8560-4843-a0b6-61ed4b171ff0',1400.00,1500.00,70.00,'2026-05-03 02:46:44',NULL,1),('c1c180db-a9f8-4c5b-b873-bf7c6b465e66','8633682f-aaa6-497b-9087-f06337a095f3',9900.00,12750.00,850.00,'2026-05-03 10:52:50',NULL,1),('c285dab4-ed32-4fbf-8e1c-9624b8001bd3','daea0040-16f3-4041-89a4-f6e4fb6f597c',9375.00,1200.00,800.00,'2026-05-03 03:00:08',NULL,1),('c93d7e6d-1f8b-423a-be03-cc53f72a36e5','7280e8d3-ac6e-4bc5-91c7-3d8533501623',9375.00,1200.00,800.00,'2026-05-03 03:00:08',NULL,1),('cb3d2abc-f234-412d-83b6-9a35c3c6cc76','0260070a-9503-4052-a97d-2ff2ad8e9f53',1980.00,2100.00,100.00,'2026-05-03 10:44:49',NULL,1),('cf162489-8492-4ab6-a418-c55e0cacbb52','ad4b6c51-8f01-4dd2-9206-8132d79bad01',670.00,750.00,40.00,'2026-05-03 02:49:23',NULL,1),('d204135f-4048-46b8-8a60-1edba1fd8b83','576b60ec-b639-4e78-9179-8c4aa6b192e0',1600.00,1700.00,80.00,'2026-05-03 02:51:19',NULL,1),('ddbc1b59-8aa0-4e0f-8fba-adb0591548df','670717d3-9ad1-464d-905a-d9adde24df60',1980.00,2100.00,100.00,'2026-05-03 10:44:49',NULL,1),('df8b867b-afaa-4e8c-942c-dc0449b9003a','cf4d733f-b597-4914-b755-46498e94d4d4',1600.00,1700.00,100.00,'2026-05-03 01:54:45',NULL,1),('e049b2d5-78bf-435b-bbf0-a7ff62dba94b','38588f43-695f-4df3-991a-dee94d3fc73d',1600.00,1700.00,80.00,'2026-05-03 01:57:20',NULL,1),('f25b4298-2756-411b-af1e-3c81f6354ac2','b89fbf0e-c88f-4758-8d67-8e5292695feb',9375.00,1200.00,800.00,'2026-05-03 03:00:10',NULL,1),('f99b4072-a0b4-4f1a-83bd-bd9594822552','05cbd100-df0f-4b6e-ab05-3c18e24d2536',670.00,750.00,40.00,'2026-05-03 02:49:23',NULL,1);
/*!40000 ALTER TABLE `product_prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(120) NOT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `packagingId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `unitsPerBox` int NOT NULL DEFAULT '24',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_unique_variant` (`name`,`brandId`,`packagingId`),
  KEY `brandId` (`brandId`),
  KEY `fk` (`packagingId`),
  CONSTRAINT `fk` FOREIGN KEY (`packagingId`) REFERENCES `packagings` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `products_ibfk_17` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_18` FOREIGN KEY (`packagingId`) REFERENCES `packagings` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('0018a942-b12f-46a4-a54b-d06a664c6034','schweppes soft drink bottle (ሽዌፕስ ለስላሳ መጠጥ)','415335de-b2fe-49b7-8d77-6b0936b89dd3','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 12:37:51','2026-05-03 12:37:51','schweppes soft drink bottle (ሽዌፕስ ለስላሳ መጠጥ) softdrink(ለስላሳ)'),('0049e301-c00f-4dc1-b4fd-7d1a60b1336d','pepsi soft drink bottle (ፔፕሲ ለስላሳ መጠጥ ቦታል)','d924dfcf-1318-4acd-9246-db959183f429','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 12:37:51','2026-05-03 12:37:51','pepsi soft drink bottle (ፔፕሲ ለስላሳ መጠጥ ቦታል) softdrink(ለስላሳ)'),('0260070a-9503-4052-a97d-2ff2ad8e9f53','lime  arada hard seltzer (ሎሚ አራዳ)','9bdca5fb-6e85-49b0-bcb2-94b3972aeb2d','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 10:44:49','2026-05-03 10:44:49','lime  arada hard seltzer (ሎሚ አራዳ) alcohol (የአልኮል)'),('05cbd100-df0f-4b6e-ab05-3c18e24d2536','miranda (ሚሪንዳ)','00063c56-3234-4599-bdd9-20f7db8debf4','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:49:23','2026-05-03 02:49:23','miranda (ሚሪንዳ) softdrink(ለስላሳ)'),('11026b4e-8280-4b68-8795-3591d7921877','7UP Soft Drink Bottle (7አፕ ለስላሳ)','2efde67b-5c93-4d10-bf74-6c8c83c9167f','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 01:18:20','2026-05-03 01:18:20','7UP is a refreshing lemon-lime flavored soft drink (ሎሚ እና ላይም ጣዕም ያለው መጠጥ). It has a clean, crisp taste with no caffeine (ካፌይን የለውም), making it suitable for any time of the day. This product is locally produced in Ethiopia (በኢትዮጵያ የተመረተ), ensuring freshness and quality.  Perfect for daily refreshment, meals, and gatherings (ለዕለታዊ መጠጥ፣ ምግብ ጋር እና ስብሰባዎች ተስማሚ). Serve chilled for the best taste (ቀዝቃዛ ሲሆን ይሻላል).'),('1f842d62-90ec-48a1-b838-3fcc9bede87a','fanta ananas (ፋንታ አናናስ)','6bbd5ab8-5587-4b50-a4d3-4bafdfd6ccfb','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:49:23','2026-05-03 02:49:23','fanta ananas (ፋንታ አናናስ) softdrink(ለስላሳ)'),('25bd78f1-9503-41fe-8861-caf6e2188341','ambo mineral water bottle (አምቦ የማዕድን ውሃ)','1027188b-d723-4bac-8939-289de45f55f6','870ec685-2ecb-41cb-afd8-0d0779cafdb7',20,'2026-05-03 12:38:23','2026-05-03 13:48:46','ambo mineral water bottle (አምቦ የማዕድን ውሃ) softdrink(ለስላሳ)'),('2b08003d-8560-4843-a0b6-61ed4b171ff0','sofi malt (ሶፊ ማልት)','83aa8af8-14e3-421f-ae09-6b63523111f5','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:46:44','2026-05-03 02:46:44','sofi malt (ሶፊ ማልት) malt (ማልት)'),('30d17234-3145-4541-a247-7010392ad697','pineapple arada hard seltzer(ማንጎ አራዳ)','ec2d29a3-4703-4a8f-9aff-0d5e99162935','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 10:44:49','2026-05-03 10:44:49','pineapple arada hard seltzer(ማንጎ አራዳ) alcohol (የአልኮል)'),('38588f43-695f-4df3-991a-dee94d3fc73d','Harar Beer (ሐረር ቢራ)','2f2fc683-bc4d-45f7-9745-1c75552ef2e4','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 01:57:20','2026-05-03 01:57:20','Harar Beer is a well-known Ethiopian lager (የኢትዮጵያ ላገር ቢራ) with a smooth and balanced taste (ለስላሳ እና የተመጣጠነ ጣዕም). It has a light bitterness and a refreshing finish (ቀላል መራራነት እና የሚያዝናና መጨረሻ), making it easy to drink.  Produced in Ethiopia (በኢትዮጵያ የተመረተ), it is ideal for social gatherings, meals, and relaxation time (ለስብሰባ፣ ምግብ ጋር እና ለመዝናናት ተስማሚ). Best served chilled (ቀዝቃዛ ሲሆን ይሻላል).'),('3cf656d7-a126-4b24-84cf-3f1ff8493139','negus malt (ንጉስ ማልት)','ee950722-bcbc-4237-8ad9-58b306bdfd7b','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:46:44','2026-05-03 02:46:44','negus malt (ንጉስ ማልት) malt (ማልት)'),('4dbe5109-ad6d-49fa-a7d1-a9042a435ec9','Bedele Beer Small Bottle 330ml (ቤዴሌ ቢራ 330 ሚሊ)','8dd42ff3-e056-4a0d-bb5f-6b12d1aa9866','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 01:48:05','2026-05-03 01:48:05','A smooth and refreshing lager beer (ላገር ቢራ) with a balanced taste. Brewed in Ethiopia (በኢትዮጵያ የተመረተ), it offers a light bitterness and crisp finish. Ideal for casual drinking and quick refreshment (ለቀላል መጠጥ ተስማሚ). Best served chilled (ቀዝቃዛ ሲሆን ይሻላል).'),('56c8ad82-23fc-42ea-b399-f5d638d38ea8','st george beer (ቅዱስ ጊዮርጊስ ቢራ)','b3e9f832-3fc2-45f2-851d-be997687cac1','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:50:31','2026-05-03 02:50:31','st george beer (ቅዱስ ጊዮርጊስ ቢራ) alcohol (የአልኮል)'),('576b60ec-b639-4e78-9179-8c4aa6b192e0','habesha beer (ሀበሻ ቢራ)','09a82833-e6f7-488b-ad62-ad3a7bd69e62','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:51:19','2026-05-03 02:51:19','habesha beer (ሀበሻ ቢራ) alcohol (የአልኮል)'),('58acfec9-6f88-46e8-9ecf-e35acdb6d62a','fernet viv liqueur (መራራ ቪቭ አረቄ)','a0290a59-79fa-4a9f-bb51-3dea77b18861','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 10:47:26','2026-05-03 10:47:26','fernet viv liqueur (መራራ ቪቭ አረቄ) liquor(አረቄ)'),('599de83f-4567-406c-8fd5-53b094fad71c','apretif viv liquor (አፕሬቲቭ ቪቭ አረቄ)','95a2c524-794a-4ff2-bd1c-cf8ea02e4862','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 10:47:27','2026-05-03 10:47:27','apretif viv liquor (አፕሬቲቭ ቪቭ አረቄ) liquor(አረቄ)'),('5fad45ea-ccab-448f-b18d-bca7090693e7','senq malt (ስንቅ ማልት)','82be94ab-8816-48dd-9fb4-e66d6adfc79c','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:46:44','2026-05-03 02:46:44','senq malt (ስንቅ ማልት) malt (ማልት)'),('670717d3-9ad1-464d-905a-d9adde24df60','apple arada hard seltzer (አራዳ አፕል )','855e1ed0-f4d7-4deb-9b07-cd0ec1c42838','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 10:44:49','2026-05-03 10:44:49','apple arada hard seltzer (አራዳ አፕል ) alcohol (የአልኮል)'),('6821e100-de18-4e54-a453-b3d55b71da14','Beherawi Ouzo Large Bottle (ብሔራዊ ኦዞ ትልቁ)','1356bbba-097f-41c1-8d61-605c2c8c76da','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 10:54:00','2026-05-03 12:10:43','Beherawi Ouzo is a traditional Ethiopian spirit (በኢትዮጵያ የተመረተ አረቄ) known for its strong anise flavor (የአኒስ ጣዕም ያለው). It has a clear, bold taste and a distinct aroma (ግልጽ እና ጠንካራ መዓዛ).  The large bottle size is suitable for gatherings and sharing (ለስብሰባዎች እና ለመካፈል ተስማሚ). Best served chilled or with water and ice (ቀዝቃዛ ወይም ከውሃ እና በረዶ ጋር ይጠጣል).'),('6961ed8a-1814-4ddb-b659-9e965b2ece3a','sprite (ስፕራየት)','b2a9983d-874f-4a5f-8f54-2f3780b952cb','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:49:22','2026-05-03 02:49:22','sprite (ስፕራየት) softdrink(ለስላሳ)'),('7280e8d3-ac6e-4bc5-91c7-3d8533501623','codgnac liquor beherawi(ኮኛክ ብሔራዊ)','fa2191e3-ccc4-49e8-a544-4ee405a8f6a9','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 03:00:08','2026-05-03 03:00:08','codgnac liquor beherawi(ኮኛክ ብሔራዊ) liquor(አረቄ)'),('7c163118-6585-4743-8085-0a10924cedb6','guder wine (ጉደር ወይን)','099abdc3-aa28-46f4-a025-cbcd953e2666','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 12:48:22','2026-05-03 12:48:22','guder wine (ጉደር ወይን) wine (ወይን)'),('8633682f-aaa6-497b-9087-f06337a095f3','Beherawi Gin Large Bottle (ብሔራዊ ጂን ትልቁ)','a72a1236-0a4c-4648-9705-5f4a7b305872','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 10:52:50','2026-05-03 10:52:50','Beherawi Gin is a locally produced Ethiopian spirit (በኢትዮጵያ የተመረተ አረቄ) with a strong and distinct flavor (ጠንካራ እና የተለየ ጣዕም). It has a clean, sharp taste with herbal notes (የእፅዋት ጣዕም ያለው).  The large bottle size is ideal for group use and extended serving (ለቡድን አጠቃቀም እና ለረጅም ጊዜ አገልግሎት ተስማሚ). Can be enjoyed on its own or mixed with other drinks (ብቻውን ወይም ከሌሎች መጠጦች ጋር ሊጠጣ ይችላል).'),('8731ffa6-3ecd-481c-ad63-11005e89c6b6','awash wine (አዋሽ ወይን)','8aeab64d-d673-4d3b-8c19-c51c9dadb8b5','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 12:48:21','2026-05-03 12:48:21','awash wine (አዋሽ ወይን) wine (ወይን)'),('8d6ddad3-3c66-4ded-b99c-7c9f69b26380','fernet beherawi liqueur  (ፈርኒጥ ብሔራዊ አረቄ)','91af032a-b8f3-4aed-bd8a-fd50b0bbf4f4','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 03:00:09','2026-05-03 03:00:09','fernet beherawi liqueur  (ፈርኒጥ ብሔራዊ አረቄ) liquor(አረቄ)'),('94847c8a-bef2-4bda-950d-29c9da4db451','Beherawi Gin Small Bottle (ብሔራዊ ጂን አነስተኛ)','a72a1236-0a4c-4648-9705-5f4a7b305872','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 03:00:08','2026-05-03 03:00:08','Beherawi Gin is a locally produced Ethiopian spirit (በኢትዮጵያ የተመረተ አረቄ) known for its strong and distinct flavor (ጠንካራ እና የተለየ ጣዕም). It offers a clean, sharp taste with herbal notes (ከእፅዋት ጋር የተያያዘ ጣዕም), typical of classic gin.  This small bottle size is convenient and easy to carry (ለመያዝ ቀላል እና ተስማሚ). Suitable for personal use or quick serving occasions (ለግል አጠቃቀም ወይም ፈጣን አገልግሎት ተስማሚ). Can be enjoyed on its own or mixed with other drinks (ብቻውን ወይም ከሌሎች መጠጦች ጋር ሊጠጣ ይችላል).'),('9885518c-bd98-4a72-9dc8-263d255a3b66','Beherawi Pineapple Liqueur Small Bottle (ብሔራዊ አናናስ አረቄ አነስተኛ ቦታል)','ce019788-0b51-4d49-a874-f249ad0caa55','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 03:00:10','2026-05-03 03:00:10','Beherawi Pineapple Liqueur is a locally produced Ethiopian spirit (በኢትዮጵያ የተመረተ አረቄ) with a sweet pineapple flavor (የአናናስ ጣፋጭ ጣዕም). It is smooth, fruity, and easy to drink (ለስላሳ እና ፍራፍሬ ጣዕም ያለው).  The small bottle size is convenient for personal use and quick serving (ለግል አጠቃቀም እና ፈጣን አገልግሎት ተስማሚ). It can be enjoyed chilled or mixed with soft drinks and cocktails (ቀዝቃዛ ሆኖ ወይም ከሌሎች መጠጦች ጋር ሊጠጣ ይችላል). Suitable for casual gatherings and relaxed moments (ለመዝናናት እና ለቀላል ስብሰባዎች ተስማሚ).'),('9efea2d7-e404-4a87-bbc8-0eff65474d80','codgnac viv liquor (ኮኛክ ቪቭ አረቄ)','6bdbd317-d6f4-4d48-add3-eeab3fabfae4','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 10:47:27','2026-05-03 10:47:27','codgnac viv liquor (ኮኛክ ቪቭ አረቄ) liquor(አረቄ)'),('ad4b6c51-8f01-4dd2-9206-8132d79bad01','fanta orange (ፋንታ ኦሬንጅ)','5d616df3-eb1c-435a-af76-3e26cc1a4a60','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:49:23','2026-05-03 02:49:23','fanta orange (ፋንታ ኦሬንጅ) softdrink(ለስላሳ)'),('b3977710-ee1d-45f8-8c14-0df35ac3bfa4','coca (ኮካ)','19b3350a-26b3-4c57-90e0-454242bdbb9e','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 02:49:23','2026-05-03 02:49:23','coca (ኮካ) softdrink(ለስላሳ)'),('b67db8e4-0fcf-46ec-841d-f232f9f66581','Beherawi Ouzo Small Bottle (ብሔራዊ ኦዞ አነስተኛ ቦታል)','1356bbba-097f-41c1-8d61-605c2c8c76da','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 03:00:09','2026-05-03 03:00:09','Beherawi Ouzo is a traditional Ethiopian spirit (በኢትዮጵያ የተመረተ አረቄ) with a strong anise flavor (የአኒስ ጣዕም ያለው). It has a clear, sharp taste and a distinct aroma (ግልጽ እና ጠንካራ መዓዛ).  This small bottle size is practical and easy to use (ለመጠቀም ቀላል እና አመቺ). Commonly served chilled or with water and ice (ቀዝቃዛ ወይም ከውሃ እና በረዶ ጋር ይጠጣል). Suitable for social occasions and casual gatherings (ለስብሰባ እና ለመዝናናት ተስማሚ).'),('b89fbf0e-c88f-4758-8d67-8e5292695feb','Beherawi Peach Liqueur Small Bottle (ብሔራዊ ፒች አረቄ አነስተኛ)','91ec334b-2b44-4031-be5f-85fa615a4bc8','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 03:00:10','2026-05-03 03:00:10','Beherawi Peach Liqueur is a locally produced Ethiopian flavored spirit (በኢትዮጵያ የተመረተ ጣዕም ያለው አረቄ) with a sweet peach taste (የፒች ጣፋጭ ጣዕም). It is smooth, fruity, and easy to drink (ለስላሳ እና ፍራፍሬ ጣዕም ያለው).  The small bottle size is convenient for personal use and serving (ለግል አጠቃቀም እና ለመስጠት ተስማሚ). It can be enjoyed chilled or mixed with soft drinks (ቀዝቃዛ ሆኖ ወይም ከሌሎች መጠጦች ጋር ሊጠጣ ይችላል). Suitable for casual gatherings and relaxed moments (ለመዝናናት እና ለቀላል ስብሰባዎች ተስማሚ).'),('c2c5dfa1-8fb0-40a2-ab06-3452f8d75126','Dashen Beer (ዳሽን ቢራ)','87ca61fe-2e1f-45c4-a5b7-8d169485130b','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 01:56:13','2026-05-03 12:19:10','Dashen Beer is a well-known Ethiopian lager (የኢትዮጵያ ላገር ቢራ) with a smooth and balanced taste. It has mild bitterness and a clean finish (ቀላል መራራነት እና ንፁህ መጨረሻ). Brewed locally, it is trusted for its consistent quality (በኢትዮጵያ የተመረተ).  Suitable for daily refreshment and social occasions (ለዕለታዊ መጠጥ እና ስብሰባ ተስማሚ). Best served chilled (ቀዝቃዛ ሲሆን ይሻላል).'),('cf4d733f-b597-4914-b755-46498e94d4d4','Bedele Beer Large Bottle 500ml (ቤዴሌ ቢራ 500 ሚሊ)','8dd42ff3-e056-4a0d-bb5f-6b12d1aa9866','870ec685-2ecb-41cb-afd8-0d0779cafdb7',20,'2026-05-03 01:54:45','2026-05-03 13:52:20','A full-size version of the classic Bedele lager (የተለመደ ላገር ቢራ). Smooth, refreshing, and well-balanced flavor with mild bitterness. Great for sharing or longer enjoyment (ለመጋራት ወይም ለረዥም ጊዜ መጠጥ ተስማሚ). Best enjoyed cold (ቀዝቃዛ ሲሆን ይሻላል).'),('d5463f96-3e2e-4320-889e-60022defa296','novida soft drink bottle (ኖቪዳ መጠጥ)','fa9bb1f9-dae9-49b7-97c5-ac980016c1b2','870ec685-2ecb-41cb-afd8-0d0779cafdb7',24,'2026-05-03 12:37:51','2026-05-03 12:37:51','novida soft drink bottle (ኖቪዳ መጠጥ) softdrink(ለስላሳ)'),('daea0040-16f3-4041-89a4-f6e4fb6f597c','apretif beherawi liquor (አፕሬቲቭ ብሔራዊ አረቄ)','295cc109-2069-4d2d-bc37-1b3a5ecf3d8a','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 03:00:08','2026-05-03 03:00:08','apretif beherawi liquor (አፕሬቲቭ ብሔራዊ አረቄ) liquor(አረቄ)'),('e758892d-3c02-4cac-a557-0e2f22c062b3','Beherawi Spearmint Liqueur Small Bottle (ብሔራዊ ስፒርሚንት አረቄ አነስተኛ)','509725a9-20ad-45db-9065-b491a66be67c','870ec685-2ecb-41cb-afd8-0d0779cafdb7',15,'2026-05-03 03:00:10','2026-05-03 03:00:10','Beherawi Spearmint Liqueur is a locally produced Ethiopian spirit (በኢትዮጵያ የተመረተ አረቄ) with a fresh mint flavor (የትኩስ ሚንት ጣዕም). It has a cool, refreshing taste with a light herbal aroma (ቀዝቃዛ እና የሚያዝናና መዓዛ).  This small bottle is easy to carry and suitable for personal use (ለመያዝ ቀላል እና ለግል አጠቃቀም ተስማሚ). It can be enjoyed chilled or mixed with other drinks (ቀዝቃዛ ሆኖ ወይም ከሌሎች መጠጦች ጋር ሊጠጣ ይችላል). Good for casual gatherings and relaxing moments (ለመዝናናት እና ለቀላል ስብሰባዎች ተስማሚ).');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `saleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `priceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `unitType` enum('box','single') NOT NULL,
  `quantity` int NOT NULL,
  `totalUnits` int NOT NULL DEFAULT '0',
  `productName` varchar(150) NOT NULL,
  `unitPrice` decimal(12,2) NOT NULL,
  `costPrice` decimal(12,2) NOT NULL,
  `totalPrice` decimal(12,2) NOT NULL,
  `totalCost` decimal(12,2) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_items_sale_id` (`saleId`),
  KEY `sale_items_product_id` (`productId`),
  KEY `priceId` (`priceId`),
  CONSTRAINT `sale_items_ibfk_16` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sale_items_ibfk_17` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `sale_items_ibfk_18` FOREIGN KEY (`priceId`) REFERENCES `product_prices` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES ('0c44bb80-3db0-42ec-af39-c09d37f8bab4','7d311f27-4fb5-43b6-8089-4a1d59d2bb02','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','single',4,4,'fanta ananas (ፋንታ አናናስ)',31.25,27.92,125.00,111.67,'2026-05-03 13:05:54','2026-05-03 13:05:54'),('0fc8cd0f-1942-4e58-8ab2-57a18e83a543','7d311f27-4fb5-43b6-8089-4a1d59d2bb02','05cbd100-df0f-4b6e-ab05-3c18e24d2536','f99b4072-a0b4-4f1a-83bd-bd9594822552','single',12,12,'miranda (ሚሪንዳ)',31.25,27.92,375.00,335.00,'2026-05-03 13:05:54','2026-05-03 13:05:54'),('125561b5-176b-46f0-b606-f2a698d888d3','301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','56c8ad82-23fc-42ea-b399-f5d638d38ea8','775792a5-abed-47b4-871b-44a6f35b8d8c','box',1,24,'st george beer (ቅዱስ ጊዮርጊስ ቢራ)',1700.00,1600.00,1700.00,1600.00,'2026-05-04 13:03:43','2026-05-04 13:03:43'),('30721092-b195-4194-8302-4d5ccb941a02','b33843a2-b0f4-47c5-9239-ee7099ef4683','b3977710-ee1d-45f8-8c14-0df35ac3bfa4','6f0b4be4-5214-4e68-bf66-157546bc8192','single',11,11,'coca (ኮካ)',30.00,27.92,330.00,307.08,'2026-05-03 15:22:10','2026-05-03 15:22:10'),('42d70149-5bc2-4ffd-ab67-8ea6f88c315d','b33843a2-b0f4-47c5-9239-ee7099ef4683','6961ed8a-1814-4ddb-b659-9e965b2ece3a','524c17c2-35dd-4d28-9fb6-e60ae51c5032','single',4,4,'sprite (ስፕራየት)',30.00,27.92,120.00,111.67,'2026-05-03 15:22:10','2026-05-03 15:22:10'),('5805e58b-0e62-4a9c-aa84-88abe437849d','301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','c2c5dfa1-8fb0-40a2-ab06-3452f8d75126','3d9b55e1-c456-4fa6-9b52-89b1dd063186','box',2,48,'Dashen Beer (ዳሽን ቢራ)',1700.00,1600.00,3400.00,3200.00,'2026-05-04 13:03:43','2026-05-04 13:03:43'),('5ec8a056-429e-4d8d-a411-f63f7ae0816f','301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','576b60ec-b639-4e78-9179-8c4aa6b192e0','d204135f-4048-46b8-8a60-1edba1fd8b83','box',1,24,'habesha beer (ሀበሻ ቢራ)',1700.00,1600.00,1700.00,1600.00,'2026-05-04 13:03:43','2026-05-04 13:03:43'),('60a8b845-7076-4f06-816f-78830d0e1662','b33843a2-b0f4-47c5-9239-ee7099ef4683','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','single',4,4,'fanta orange (ፋንታ ኦሬንጅ)',30.00,27.92,120.00,111.67,'2026-05-03 15:22:10','2026-05-03 15:22:10'),('6bbee6fb-af24-4860-bbda-a65a9cc4449f','b33843a2-b0f4-47c5-9239-ee7099ef4683','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','single',4,4,'fanta ananas (ፋንታ አናናስ)',30.00,27.92,120.00,111.67,'2026-05-03 15:22:10','2026-05-03 15:22:10'),('6d066fe0-15ee-494b-80e7-bdb2985a060d','7c1267e0-e929-4218-a665-3e5e61472a60','7c163118-6585-4743-8085-0a10924cedb6','114e20da-bf6b-4cd5-a1a4-838422320294','single',1,1,'guder wine (ጉደር ወይን)',600.00,350.00,600.00,350.00,'2026-05-03 13:08:13','2026-05-03 13:08:13'),('6f3ef946-5fe8-47e2-a8fa-43515d8c1da3','7d311f27-4fb5-43b6-8089-4a1d59d2bb02','b3977710-ee1d-45f8-8c14-0df35ac3bfa4','6f0b4be4-5214-4e68-bf66-157546bc8192','single',4,4,'coca (ኮካ)',31.25,27.92,125.00,111.67,'2026-05-03 13:05:54','2026-05-03 13:05:54'),('902f5d9f-fd54-45d0-82d3-6612495b5817','301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','38588f43-695f-4df3-991a-dee94d3fc73d','e049b2d5-78bf-435b-bbf0-a7ff62dba94b','box',1,24,'Harar Beer (ሐረር ቢራ)',1700.00,1600.00,1700.00,1600.00,'2026-05-04 13:03:43','2026-05-04 13:03:43'),('a5030c97-a58e-4116-8a96-e6640dbd6c6d','b33843a2-b0f4-47c5-9239-ee7099ef4683','d5463f96-3e2e-4320-889e-60022defa296','9f5ee574-f91d-4d10-a2b1-31510c785676','single',1,1,'novida soft drink bottle (ኖቪዳ መጠጥ)',30.00,27.92,30.00,27.92,'2026-05-03 15:22:10','2026-05-03 15:22:10'),('ddff4bbd-bec0-4ea1-a32d-c6677267506b','7d311f27-4fb5-43b6-8089-4a1d59d2bb02','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','single',4,4,'fanta orange (ፋንታ ኦሬንጅ)',31.25,27.92,125.00,111.67,'2026-05-03 13:05:54','2026-05-03 13:05:54'),('e4b45b21-6b4b-4be7-9bef-32f1f2c9f19f','98797f22-7bfe-4b6c-a11f-74cc1d595acb','56c8ad82-23fc-42ea-b399-f5d638d38ea8','775792a5-abed-47b4-871b-44a6f35b8d8c','box',1,24,'st george beer (ቅዱስ ጊዮርጊስ ቢራ)',1700.00,1600.00,1700.00,1600.00,'2026-05-03 12:58:36','2026-05-03 12:58:36'),('eaf4d10a-11e3-44b3-a220-7a2f24bf4860','20f19cd9-b02d-4022-856c-5c7fe50ef1c9','94847c8a-bef2-4bda-950d-29c9da4db451','6ef940e3-0a5d-4602-990c-526f8a26373e','single',1,1,'Beherawi Gin Small Bottle (ብሔራዊ ጂን አነስተኛ)',800.00,625.00,800.00,625.00,'2026-05-03 12:56:57','2026-05-03 12:56:57');
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `invoiceNumber` varchar(255) NOT NULL,
  `customerName` varchar(120) NOT NULL,
  `description` text,
  `totalAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `totalCost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `profit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paymentType` enum('cash','credit') NOT NULL,
  `paymentStatus` enum('paid','pending') NOT NULL DEFAULT 'paid',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoiceNumber` (`invoiceNumber`),
  UNIQUE KEY `sales_invoice_number` (`invoiceNumber`),
  UNIQUE KEY `invoiceNumber_2` (`invoiceNumber`),
  UNIQUE KEY `invoiceNumber_3` (`invoiceNumber`),
  UNIQUE KEY `invoiceNumber_4` (`invoiceNumber`),
  UNIQUE KEY `invoiceNumber_5` (`invoiceNumber`),
  UNIQUE KEY `invoiceNumber_6` (`invoiceNumber`),
  UNIQUE KEY `invoiceNumber_7` (`invoiceNumber`),
  KEY `sales_created_at` (`createdAt`),
  KEY `sales_payment_status` (`paymentStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES ('20f19cd9-b02d-4022-856c-5c7fe50ef1c9','INV-1777802217492','Walk-in 5/3/2026 12:56 PM','Walk-in-Customer',800.00,625.00,175.00,'cash','paid','2026-05-03 12:56:57','2026-05-03 12:56:57'),('301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','INV-1777888998663','Selam block 31',NULL,8500.00,8000.00,500.00,'cash','paid','2026-05-04 13:03:18','2026-05-04 13:03:43'),('7c1267e0-e929-4218-a665-3e5e61472a60','INV-1777802893291','Walk-in 5/3/2026 01:08 PM',NULL,600.00,350.00,250.00,'cash','paid','2026-05-03 13:08:13','2026-05-03 13:08:13'),('7d311f27-4fb5-43b6-8089-4a1d59d2bb02','INV-1777802754408','Walk-in 5/3/2026 01:05 PM',NULL,750.00,670.00,80.00,'cash','paid','2026-05-03 13:05:54','2026-05-03 13:05:54'),('98797f22-7bfe-4b6c-a11f-74cc1d595acb','INV-1777802316893','Walk-in 5/3/2026 12:58 PM',NULL,1700.00,1600.00,100.00,'cash','paid','2026-05-03 12:58:36','2026-05-03 12:58:36'),('b33843a2-b0f4-47c5-9239-ee7099ef4683','INV-1777810293256','አቤ',NULL,720.00,670.00,50.00,'cash','paid','2026-05-03 15:11:33','2026-05-03 15:22:10');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_history`
--

DROP TABLE IF EXISTS `stock_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_history` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `priceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Tracks the specific buy/sell price at the time of this movement',
  `actionType` enum('restock','adjust','exchange','initial','sale') NOT NULL,
  `boxQuantityBefore` int NOT NULL,
  `singleQuantityBefore` int NOT NULL,
  `boxQuantityAfter` int NOT NULL,
  `singleQuantityAfter` int NOT NULL,
  `boxQuantityChange` int NOT NULL,
  `singleQuantityChange` int NOT NULL,
  `notes` text,
  `isFree` tinyint(1) NOT NULL DEFAULT '0',
  `saleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_history_product_id` (`productId`),
  KEY `stock_history_price_id` (`priceId`),
  KEY `stock_history_action_type` (`actionType`),
  KEY `stock_history_created_at` (`createdAt`),
  KEY `saleId` (`saleId`),
  CONSTRAINT `stock_history_ibfk_13` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stock_history_ibfk_14` FOREIGN KEY (`priceId`) REFERENCES `product_prices` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `stock_history_ibfk_15` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_history`
--

LOCK TABLES `stock_history` WRITE;
/*!40000 ALTER TABLE `stock_history` DISABLE KEYS */;
INSERT INTO `stock_history` VALUES ('01585cff-8e7f-4e32-8be2-ec4c3f8eceea','38588f43-695f-4df3-991a-dee94d3fc73d','e049b2d5-78bf-435b-bbf0-a7ff62dba94b','adjust',1,7,2,7,1,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:43','2026-05-04 13:03:43'),('04780ef3-5dc4-4533-b946-93c242bcde6b','7280e8d3-ac6e-4bc5-91c7-3d8533501623','c93d7e6d-1f8b-423a-be03-cc53f72a36e5','initial',0,0,0,5,0,5,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('07231662-f330-4382-bbb4-0ccef15801b8','6961ed8a-1814-4ddb-b659-9e965b2ece3a','524c17c2-35dd-4d28-9fb6-e60ae51c5032','initial',0,0,3,0,3,0,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('08fb9e57-e168-45e8-b207-3efa243375ab','38588f43-695f-4df3-991a-dee94d3fc73d','e049b2d5-78bf-435b-bbf0-a7ff62dba94b','sale',2,7,1,7,-1,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:18','2026-05-04 13:03:18'),('0bba1d86-391a-4199-b03b-20effdad266c','c2c5dfa1-8fb0-40a2-ab06-3452f8d75126','3d9b55e1-c456-4fa6-9b52-89b1dd063186','sale',6,18,4,18,-2,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:43','2026-05-04 13:03:43'),('1025d07a-dcf5-4c04-95fd-c37228f6497b','c2c5dfa1-8fb0-40a2-ab06-3452f8d75126','3d9b55e1-c456-4fa6-9b52-89b1dd063186','sale',6,18,4,18,-2,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:18','2026-05-04 13:03:18'),('17d63833-fd7c-4bd7-8b8f-6267778d1fce','56c8ad82-23fc-42ea-b399-f5d638d38ea8','775792a5-abed-47b4-871b-44a6f35b8d8c','initial',0,0,7,15,7,15,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('18299133-776b-4401-84fb-e18a57a24244','56c8ad82-23fc-42ea-b399-f5d638d38ea8','775792a5-abed-47b4-871b-44a6f35b8d8c','sale',7,15,6,15,-1,0,NULL,0,'98797f22-7bfe-4b6c-a11f-74cc1d595acb','2026-05-03 12:58:36','2026-05-03 12:58:36'),('1963de40-91a4-4732-9c1b-cefc069f1302','b3977710-ee1d-45f8-8c14-0df35ac3bfa4','6f0b4be4-5214-4e68-bf66-157546bc8192','sale',3,20,3,9,0,-11,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('21eb45bf-123e-4526-9e34-8f5071fcd573','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','restock',3,3,3,6,0,3,'Manual restock',0,NULL,'2026-05-03 15:05:47','2026-05-03 15:05:47'),('22f1d9e1-e98c-4554-a0f3-cbae75c3d9f7','daea0040-16f3-4041-89a4-f6e4fb6f597c','c285dab4-ed32-4fbf-8e1c-9624b8001bd3','adjust',0,4,0,2,0,-2,'Manual adjustment',0,NULL,'2026-05-03 12:54:47','2026-05-03 12:54:47'),('25034709-98f1-49a6-ae78-94cb7e3f94c6','cf4d733f-b597-4914-b755-46498e94d4d4','df8b867b-afaa-4e8c-942c-dc0449b9003a','initial',0,0,0,17,0,17,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('257eca0c-d801-4ab8-b426-2e1765e2a71d','0018a942-b12f-46a4-a54b-d06a664c6034','180a9eb5-2a85-4382-abcd-ff7ef07118cc','adjust',0,11,0,1,0,-10,'Manual adjustment',0,NULL,'2026-05-03 13:57:48','2026-05-03 13:57:48'),('25f34edd-f40b-4789-ba1f-9bbf0f066eb5','2b08003d-8560-4843-a0b6-61ed4b171ff0','bbe32bbe-822d-4055-997c-ce291153f488','initial',0,0,0,0,0,0,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('27d75d87-45ef-46e1-a931-6db46580982d','9efea2d7-e404-4a87-bbc8-0eff65474d80','4b6b6078-74b6-4d5d-bc8e-69ef86f2e165','initial',0,0,0,1,0,1,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('2b395fed-9a52-4a98-83f7-c137edd70443','94847c8a-bef2-4bda-950d-29c9da4db451','6ef940e3-0a5d-4602-990c-526f8a26373e','sale',0,3,0,2,0,-1,NULL,0,'20f19cd9-b02d-4022-856c-5c7fe50ef1c9','2026-05-03 12:56:57','2026-05-03 12:56:57'),('2d48ef39-46e1-4862-8f6f-3f2ee34bee85','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','sale',3,6,3,2,0,-4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:11:33','2026-05-03 15:11:33'),('2f60cad6-223e-4834-a0ad-cf91be795c7e','30d17234-3145-4541-a247-7010392ad697','36df50ba-52b1-49ea-ae4d-fe9e9c87fc0a','initial',0,0,1,0,1,0,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('32255cc8-d761-4dd5-a03d-08a8ebc74686','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','sale',4,18,4,14,0,-4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:12:40','2026-05-03 15:12:40'),('364bf286-b674-4e47-9636-ed90fcbbeead','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','sale',3,7,3,3,0,-4,NULL,0,'7d311f27-4fb5-43b6-8089-4a1d59d2bb02','2026-05-03 13:05:54','2026-05-03 13:05:54'),('36ac4e8e-017a-4860-9869-98e6fc8ed30f','6821e100-de18-4e54-a453-b3d55b71da14','75134a9e-2fcb-4cbf-822f-48fcfd01bc66','initial',0,0,0,2,0,2,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('3747408c-f550-402c-8d85-34611710d4e4','6961ed8a-1814-4ddb-b659-9e965b2ece3a','524c17c2-35dd-4d28-9fb6-e60ae51c5032','sale',2,24,2,20,0,-4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:12:40','2026-05-03 15:12:40'),('37c04e42-aed4-4e43-821e-2cd63fdd34b2','b89fbf0e-c88f-4758-8d67-8e5292695feb','f25b4298-2756-411b-af1e-3c81f6354ac2','initial',0,0,0,1,0,1,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('3a863642-36ad-4aad-bf64-48a768038aa7','8633682f-aaa6-497b-9087-f06337a095f3','c1c180db-a9f8-4c5b-b873-bf7c6b465e66','initial',0,0,0,5,0,5,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('3ae122c1-1225-4508-a61d-03247a944660','94847c8a-bef2-4bda-950d-29c9da4db451','6ef940e3-0a5d-4602-990c-526f8a26373e','initial',0,0,0,3,0,3,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('3b6c407e-bd53-418b-bf69-26ade920bb80','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','adjust',3,2,3,6,0,4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:12:40','2026-05-03 15:12:40'),('3c1fab4a-22a4-435b-9736-e8e62df6ea6b','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','sale',4,18,4,14,0,-4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:11:33','2026-05-03 15:11:33'),('3d7115b0-f3f0-4c37-a5c4-3b9baecec989','56c8ad82-23fc-42ea-b399-f5d638d38ea8','775792a5-abed-47b4-871b-44a6f35b8d8c','adjust',0,14,7,14,7,0,'Manual adjustment',0,NULL,'2026-05-04 13:02:04','2026-05-04 13:02:04'),('417beab3-d5a3-44a9-b64c-7d92efec3609','11026b4e-8280-4b68-8795-3591d7921877','65ec8c3b-6798-41fe-8463-1875eec01a0c','initial',0,0,0,0,0,0,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('5463e233-cd93-4fb1-ae54-004c28829115','38588f43-695f-4df3-991a-dee94d3fc73d','e049b2d5-78bf-435b-bbf0-a7ff62dba94b','sale',2,7,1,7,-1,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:43','2026-05-04 13:03:43'),('57b09d6c-f4a7-4354-a81c-e52e6d0224a1','05cbd100-df0f-4b6e-ab05-3c18e24d2536','f99b4072-a0b4-4f1a-83bd-bd9594822552','sale',11,20,11,8,0,-12,NULL,0,'7d311f27-4fb5-43b6-8089-4a1d59d2bb02','2026-05-03 13:05:54','2026-05-03 13:05:54'),('5823adff-4d64-450b-a9b4-1d2ec1a7dab9','670717d3-9ad1-464d-905a-d9adde24df60','ddbc1b59-8aa0-4e0f-8fba-adb0591548df','initial',0,0,1,0,1,0,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('5909a0d4-77de-4e5e-838d-7fd1d2e6c12d','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','adjust',4,0,4,18,0,18,'Manual adjustment',0,NULL,'2026-05-03 13:55:19','2026-05-03 13:55:19'),('5c2f2fd9-94d2-46b2-b64d-77058428f238','d5463f96-3e2e-4320-889e-60022defa296','9f5ee574-f91d-4d10-a2b1-31510c785676','adjust',0,1,0,3,0,2,'Manual adjustment',0,NULL,'2026-05-03 13:57:18','2026-05-03 13:57:18'),('5c7e91e6-e707-418a-8a1c-d7261bbb6e57','6961ed8a-1814-4ddb-b659-9e965b2ece3a','524c17c2-35dd-4d28-9fb6-e60ae51c5032','adjust',2,20,2,24,0,4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('5d02b64f-8a5f-40ee-a261-5e2b31075d47','38588f43-695f-4df3-991a-dee94d3fc73d','e049b2d5-78bf-435b-bbf0-a7ff62dba94b','initial',0,0,2,7,2,7,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('6031adf0-b55a-4953-949c-53b2dc54e3d0','9885518c-bd98-4a72-9dc8-263d255a3b66','4ae5c82c-dd41-4c33-9055-29b222ceee1f','initial',0,0,0,1,0,1,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('6096deb5-0c3b-4890-9449-28b444be432b','d5463f96-3e2e-4320-889e-60022defa296','9f5ee574-f91d-4d10-a2b1-31510c785676','sale',0,3,0,2,0,-1,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:12:40','2026-05-03 15:12:40'),('67dd5a42-265d-46b8-bc63-2ee6be016b55','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','initial',0,0,0,18,0,18,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('67f4c0f2-a141-4991-91c3-16c3e512f2ce','4dbe5109-ad6d-49fa-a7d1-a9042a435ec9','30d5a774-8d46-44c1-b7dc-fe1850875cc4','initial',0,0,3,0,3,0,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('7380d564-add8-4780-b535-51697a1d8528','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','initial',0,0,3,7,3,7,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('74c4b58b-66de-4942-8579-a90afec39a5f','5fad45ea-ccab-448f-b18d-bca7090693e7','83b63870-6a4b-410f-8321-42749e87f2d1','initial',0,0,0,0,0,0,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('79407a1c-8195-465f-9dd0-af0f609314a2','0018a942-b12f-46a4-a54b-d06a664c6034','180a9eb5-2a85-4382-abcd-ff7ef07118cc','initial',0,0,0,11,0,11,'Initial stock creation',0,NULL,'2026-05-03 12:40:19','2026-05-03 12:40:19'),('7983208f-2f65-4a2f-8005-ae474786446d','3cf656d7-a126-4b24-84cf-3f1ff8493139','6595e2b5-e108-41d5-a021-17ac5ce0bae1','initial',0,0,4,16,4,16,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('7e16b5bf-3937-49c4-a0c8-82e4c4b3ef2f','c2c5dfa1-8fb0-40a2-ab06-3452f8d75126','3d9b55e1-c456-4fa6-9b52-89b1dd063186','adjust',4,18,6,18,2,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:43','2026-05-04 13:03:43'),('7e9fc12f-d9e4-4af1-9512-26edc938e9cd','6961ed8a-1814-4ddb-b659-9e965b2ece3a','524c17c2-35dd-4d28-9fb6-e60ae51c5032','sale',2,24,2,20,0,-4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('7ff470d9-d319-4114-a87c-26cc13de7180','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','adjust',4,14,4,18,0,4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('809feb30-5db8-4af7-bbcc-da5aba53c9d8','576b60ec-b639-4e78-9179-8c4aa6b192e0','d204135f-4048-46b8-8a60-1edba1fd8b83','adjust',3,20,4,20,1,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:43','2026-05-04 13:03:43'),('834bbdd8-6d1e-425f-8b3c-c3e4b956f47f','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','sale',3,6,3,2,0,-4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:12:40','2026-05-03 15:12:40'),('91095184-5138-41a1-a59b-c58c4e8505d1','daea0040-16f3-4041-89a4-f6e4fb6f597c','c285dab4-ed32-4fbf-8e1c-9624b8001bd3','initial',0,0,0,4,0,4,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('912daa4e-2110-4ca6-92d4-5818b54b5070','56c8ad82-23fc-42ea-b399-f5d638d38ea8','775792a5-abed-47b4-871b-44a6f35b8d8c','sale',7,14,6,14,-1,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:43','2026-05-04 13:03:43'),('92359af3-23b9-4e7b-94aa-47cd6f2139e5','d5463f96-3e2e-4320-889e-60022defa296','9f5ee574-f91d-4d10-a2b1-31510c785676','adjust',0,2,0,3,0,1,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('93fdf14f-4a39-4249-b3f2-879b9438863b','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','adjust',4,14,4,18,0,4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:12:40','2026-05-03 15:12:40'),('95958e79-2af5-4dda-8b74-d6e85253f9d4','0049e301-c00f-4dc1-b4fd-7d1a60b1336d','7bd4c18d-834f-42f7-a5a5-bb4565c5c678','initial',0,0,0,3,0,3,'Initial stock creation',0,NULL,'2026-05-03 12:40:19','2026-05-03 12:40:19'),('97b20776-3dc7-4d37-832f-2aea5f3a2b47','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','adjust',3,2,3,6,0,4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('97fc2cfa-c362-47fb-856d-aebbdc76c038','0260070a-9503-4052-a97d-2ff2ad8e9f53','cb3d2abc-f234-412d-83b6-9a35c3c6cc76','initial',0,0,0,4,0,4,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('982c597b-3304-461e-ada6-163563fcb8ad','d5463f96-3e2e-4320-889e-60022defa296','9f5ee574-f91d-4d10-a2b1-31510c785676','initial',0,0,0,1,0,1,'Initial stock creation',0,NULL,'2026-05-03 12:40:19','2026-05-03 12:40:19'),('9ba65d51-e9d0-4840-b323-03072262787d','b3977710-ee1d-45f8-8c14-0df35ac3bfa4','6f0b4be4-5214-4e68-bf66-157546bc8192','sale',4,0,3,20,-1,20,NULL,0,'7d311f27-4fb5-43b6-8089-4a1d59d2bb02','2026-05-03 13:05:54','2026-05-03 13:05:54'),('9c207536-0a0f-468c-866f-05c4fdd27776','576b60ec-b639-4e78-9179-8c4aa6b192e0','d204135f-4048-46b8-8a60-1edba1fd8b83','sale',4,20,3,20,-1,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:43','2026-05-04 13:03:43'),('9caa8379-5e70-4ebc-a2ed-bfff43e6f5cd','b3977710-ee1d-45f8-8c14-0df35ac3bfa4','6f0b4be4-5214-4e68-bf66-157546bc8192','initial',0,0,4,0,4,0,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('aa168414-9bc0-41a0-9827-b51d67a6feef','7c163118-6585-4743-8085-0a10924cedb6','114e20da-bf6b-4cd5-a1a4-838422320294','initial',0,0,15,0,15,0,'Initial stock creation',0,NULL,'2026-05-03 12:49:06','2026-05-03 12:49:06'),('b08cbf13-1466-4b7f-9d4d-e641bb74541c','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','sale',4,18,4,14,0,-4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('b240f66d-df89-4dde-b654-aa97b4d97e9c','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','adjust',0,14,4,0,4,-14,'Manual adjustment',0,NULL,'2026-05-03 13:54:57','2026-05-03 13:54:57'),('b7030749-4c0f-4a08-b339-37f09a6d6699','d5463f96-3e2e-4320-889e-60022defa296','9f5ee574-f91d-4d10-a2b1-31510c785676','sale',0,3,0,2,0,-1,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('b7528327-295b-4089-905e-b51cfeeb70df','0260070a-9503-4052-a97d-2ff2ad8e9f53','cb3d2abc-f234-412d-83b6-9a35c3c6cc76','initial',0,0,1,0,1,0,'Initial stock creation',0,NULL,'2026-05-03 11:42:10','2026-05-03 11:42:10'),('bae16aa7-8899-49c2-bc48-3552edd5c425','56c8ad82-23fc-42ea-b399-f5d638d38ea8','775792a5-abed-47b4-871b-44a6f35b8d8c','adjust',6,15,0,14,-6,-1,'Manual adjustment',0,NULL,'2026-05-03 13:51:01','2026-05-03 13:51:01'),('baf4bac9-3d25-487f-937d-71d38b5f900c','25bd78f1-9503-41fe-8861-caf6e2188341','b6cf864a-2adb-47a7-a5a8-db0010e3532b','initial',0,0,2,5,2,5,'Initial stock creation',0,NULL,'2026-05-03 12:40:19','2026-05-03 12:40:19'),('be4c5e2b-5aef-426a-8180-b586547bf93d','58acfec9-6f88-46e8-9ecf-e35acdb6d62a','003b0849-73a8-4b37-938f-ea6a099db371','initial',0,0,0,1,0,1,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('bfaab95f-9557-493f-907f-163253455d3b','8d6ddad3-3c66-4ded-b99c-7c9f69b26380','91e78918-fd38-4fe4-86fc-cf30f3706a0e','initial',0,0,0,1,0,1,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('c0084395-21b4-4fa9-b50a-18e30447a47c','ad4b6c51-8f01-4dd2-9206-8132d79bad01','cf162489-8492-4ab6-a418-c55e0cacbb52','sale',0,18,0,14,0,-4,NULL,0,'7d311f27-4fb5-43b6-8089-4a1d59d2bb02','2026-05-03 13:05:54','2026-05-03 13:05:54'),('c303176b-07c8-41d5-92ae-a666ec3683a9','05cbd100-df0f-4b6e-ab05-3c18e24d2536','f99b4072-a0b4-4f1a-83bd-bd9594822552','initial',0,0,11,20,11,20,'Initial stock creation',0,NULL,'2026-05-03 12:28:49','2026-05-03 12:28:49'),('c6e33f53-879a-497e-8ff0-c2402a25a7b8','6961ed8a-1814-4ddb-b659-9e965b2ece3a','524c17c2-35dd-4d28-9fb6-e60ae51c5032','sale',3,0,2,20,-1,20,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:11:33','2026-05-03 15:11:33'),('cb221cfc-2ebc-4cc5-b0ed-36b2f2dc76eb','e758892d-3c02-4cac-a557-0e2f22c062b3','2a0192b1-f4f2-406d-9bfe-6976ad26d031','initial',0,0,0,4,0,4,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('cf4d78da-7bd7-4f5e-81e2-d3e3783b9fcc','576b60ec-b639-4e78-9179-8c4aa6b192e0','d204135f-4048-46b8-8a60-1edba1fd8b83','initial',0,0,4,20,4,20,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('d3499d4c-a5c7-4904-940e-bf20f75f75ae','7c163118-6585-4743-8085-0a10924cedb6','114e20da-bf6b-4cd5-a1a4-838422320294','sale',15,0,14,14,-1,14,NULL,0,'7c1267e0-e929-4218-a665-3e5e61472a60','2026-05-03 13:08:13','2026-05-03 13:08:13'),('dc60824e-ba19-42c8-9d0e-1f789fcd7801','58acfec9-6f88-46e8-9ecf-e35acdb6d62a','003b0849-73a8-4b37-938f-ea6a099db371','initial',0,0,1,0,1,0,'Initial stock creation',0,NULL,'2026-05-03 11:42:10','2026-05-03 11:42:10'),('ded11dfa-f25b-497f-8f8f-b9c4fe048c5e','8731ffa6-3ecd-481c-ad63-11005e89c6b6','01980a21-0f94-46e4-8fdf-1ca9e8b2fd84','initial',0,0,15,0,15,0,'Initial stock creation',0,NULL,'2026-05-03 12:49:06','2026-05-03 12:49:06'),('e165fce8-ad3c-45b3-9dde-6bf08d1e6d1f','c2c5dfa1-8fb0-40a2-ab06-3452f8d75126','3d9b55e1-c456-4fa6-9b52-89b1dd063186','initial',0,0,0,0,0,0,'Initial stock creation',0,NULL,'2026-05-03 10:11:52','2026-05-03 10:11:52'),('e17b38fe-133b-4cac-88eb-5042d177cf86','c2c5dfa1-8fb0-40a2-ab06-3452f8d75126','3d9b55e1-c456-4fa6-9b52-89b1dd063186','initial',0,0,6,18,6,18,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('e26d873b-666d-4586-826c-323ac61c36bb','1f842d62-90ec-48a1-b838-3fcc9bede87a','89a514de-4f61-4198-b47d-689c7b4878f5','sale',3,6,3,2,0,-4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('edb35d31-1dba-4fec-bad5-d6def4ab3826','b67db8e4-0fcf-46ec-841d-f232f9f66581','af111939-18a3-446b-8a5f-4e99ad46f710','initial',0,0,0,5,0,5,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('ef001c06-387a-4fa4-b526-a0534bf562b9','11026b4e-8280-4b68-8795-3591d7921877','65ec8c3b-6798-41fe-8463-1875eec01a0c','restock',0,0,0,17,0,17,'Manual restock',0,NULL,'2026-05-03 12:29:12','2026-05-03 12:29:12'),('f0420cc7-824f-4ae4-95fe-f22deec9ccf4','b3977710-ee1d-45f8-8c14-0df35ac3bfa4','6f0b4be4-5214-4e68-bf66-157546bc8192','adjust',3,9,3,20,0,11,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:22:10','2026-05-03 15:22:10'),('f4c6a181-1617-4ab9-91d8-e4955f52a68c','6961ed8a-1814-4ddb-b659-9e965b2ece3a','524c17c2-35dd-4d28-9fb6-e60ae51c5032','adjust',2,20,2,24,0,4,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:12:40','2026-05-03 15:12:40'),('f830931b-707d-4e2f-84a9-2bef85437f6a','599de83f-4567-406c-8fd5-53b094fad71c','87f37a72-bc07-43a4-8a55-191143fb21ad','initial',0,0,0,1,0,1,'Initial stock creation',0,NULL,'2026-05-03 12:21:50','2026-05-03 12:21:50'),('fddf8faa-da25-4273-bd88-4de8376e2c21','b3977710-ee1d-45f8-8c14-0df35ac3bfa4','6f0b4be4-5214-4e68-bf66-157546bc8192','sale',3,20,3,9,0,-11,NULL,0,'b33843a2-b0f4-47c5-9239-ee7099ef4683','2026-05-03 15:12:40','2026-05-03 15:12:40'),('ffa9f8ac-f95f-4754-9306-6e4b01b97942','576b60ec-b639-4e78-9179-8c4aa6b192e0','d204135f-4048-46b8-8a60-1edba1fd8b83','sale',4,20,3,20,-1,0,NULL,0,'301e81b0-3e3b-4ef6-9b18-8e4ca7e12d2f','2026-05-04 13:03:18','2026-05-04 13:03:18');
/*!40000 ALTER TABLE `stock_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocks`
--

DROP TABLE IF EXISTS `stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocks` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `boxQuantity` int NOT NULL DEFAULT '0',
  `singleQuantity` int NOT NULL DEFAULT '0',
  `containerType` enum('box','single') NOT NULL DEFAULT 'box',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `productId` (`productId`),
  UNIQUE KEY `stocks_product_id` (`productId`),
  CONSTRAINT `stocks_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocks`
--

LOCK TABLES `stocks` WRITE;
/*!40000 ALTER TABLE `stocks` DISABLE KEYS */;
INSERT INTO `stocks` VALUES ('029739e5-0a1d-4a5d-91cf-ec1c6667b5a2','94847c8a-bef2-4bda-950d-29c9da4db451',0,2,'box','2026-05-03 12:21:50','2026-05-03 12:56:57'),('0c845df8-96f8-46d0-9d64-9f3b1fbcd5fe','25bd78f1-9503-41fe-8861-caf6e2188341',2,5,'box','2026-05-03 12:40:19','2026-05-03 12:40:19'),('104def6c-ca8e-4547-ac57-0ae4d6390401','b89fbf0e-c88f-4758-8d67-8e5292695feb',0,1,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('12980a43-a24f-462c-82e2-036235ada469','7280e8d3-ac6e-4bc5-91c7-3d8533501623',0,5,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('157b1cfb-219d-48f0-964e-7a88989c00f0','8731ffa6-3ecd-481c-ad63-11005e89c6b6',15,0,'box','2026-05-03 12:49:06','2026-05-03 12:49:06'),('165e4c8c-c1a6-46dd-a4c8-16a1cde8a7b6','0260070a-9503-4052-a97d-2ff2ad8e9f53',0,4,'box','2026-05-03 12:28:49','2026-05-03 12:28:49'),('1a2ec47b-235b-457a-9a32-952b266c4a32','58acfec9-6f88-46e8-9ecf-e35acdb6d62a',0,1,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('1d14a3f1-a940-48db-a20d-d8031e8ae13c','4dbe5109-ad6d-49fa-a7d1-a9042a435ec9',3,0,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('22209b05-372b-46b0-a723-5f3a870cb0a7','e758892d-3c02-4cac-a557-0e2f22c062b3',0,4,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('2df483da-bfb3-4a51-b956-baf83f45bf7f','670717d3-9ad1-464d-905a-d9adde24df60',1,0,'box','2026-05-03 12:28:49','2026-05-03 12:28:49'),('3151c5a8-729d-42d4-a4f7-f65ef5702314','daea0040-16f3-4041-89a4-f6e4fb6f597c',0,2,'single','2026-05-03 12:21:50','2026-05-03 12:54:47'),('31e961e0-0448-440d-93c9-3290ba7c37cc','576b60ec-b639-4e78-9179-8c4aa6b192e0',3,20,'box','2026-05-03 12:21:50','2026-05-04 13:03:43'),('3a08ab75-8883-4572-b1f8-40c074a1eac4','9efea2d7-e404-4a87-bbc8-0eff65474d80',0,1,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('40c0e56a-5c26-4b80-9dc3-c12faec28365','5fad45ea-ccab-448f-b18d-bca7090693e7',0,0,'box','2026-05-03 12:28:49','2026-05-03 12:28:49'),('460cb6d4-5e62-4f49-b4e1-9fc6e855024c','3cf656d7-a126-4b24-84cf-3f1ff8493139',4,16,'box','2026-05-03 12:28:49','2026-05-03 12:28:49'),('465a02a4-f253-4ab4-8ea0-d017a105e58d','0049e301-c00f-4dc1-b4fd-7d1a60b1336d',0,3,'box','2026-05-03 12:40:19','2026-05-03 12:40:19'),('4adb6ffd-d37d-4984-a091-566e6f70d2d9','cf4d733f-b597-4914-b755-46498e94d4d4',0,17,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('5e0fbe9e-8700-4ad4-bd6a-383593587a78','1f842d62-90ec-48a1-b838-3fcc9bede87a',3,2,'box','2026-05-03 12:28:49','2026-05-03 15:22:10'),('60b31ef0-1141-4424-900b-c92490c81873','6961ed8a-1814-4ddb-b659-9e965b2ece3a',2,20,'box','2026-05-03 12:28:49','2026-05-03 15:22:10'),('72c59608-72c4-4099-9ad9-ff62f007e051','6821e100-de18-4e54-a453-b3d55b71da14',0,2,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('79be4638-8300-46f3-9ae3-32056fda06a6','56c8ad82-23fc-42ea-b399-f5d638d38ea8',6,14,'single','2026-05-03 12:21:50','2026-05-04 13:03:43'),('7d0967c2-2c5f-4664-9a52-a58a9926548c','8633682f-aaa6-497b-9087-f06337a095f3',0,5,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('7d3e6e88-8835-4f11-83d9-b2090538ac54','b67db8e4-0fcf-46ec-841d-f232f9f66581',0,5,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('7fd34f2b-243d-4ca5-a3cb-b43b006c6057','38588f43-695f-4df3-991a-dee94d3fc73d',1,7,'box','2026-05-03 12:21:50','2026-05-04 13:03:43'),('825bb7ee-4873-451c-af16-d6be7eef9cb6','c2c5dfa1-8fb0-40a2-ab06-3452f8d75126',4,18,'box','2026-05-03 12:21:50','2026-05-04 13:03:43'),('8eaaba75-c74b-4b54-b1d5-70eb9c78ceb9','8d6ddad3-3c66-4ded-b99c-7c9f69b26380',0,1,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('9129e420-7c71-4eae-9a8a-1d6b96481aeb','7c163118-6585-4743-8085-0a10924cedb6',14,14,'box','2026-05-03 12:49:06','2026-05-03 13:08:13'),('9b799f6d-6cd2-4f3a-856b-b7e24eb45f52','9885518c-bd98-4a72-9dc8-263d255a3b66',0,1,'box','2026-05-03 12:21:50','2026-05-03 12:21:50'),('a773336a-cf76-46d9-8e0b-4aa3937477e0','0018a942-b12f-46a4-a54b-d06a664c6034',0,1,'single','2026-05-03 12:40:19','2026-05-03 13:57:48'),('ab2835f2-3bf5-4827-b065-a45b514fd3b3','b3977710-ee1d-45f8-8c14-0df35ac3bfa4',3,9,'box','2026-05-03 12:28:49','2026-05-03 15:22:10'),('ba563690-774a-40d1-a1ec-75a898f6e436','11026b4e-8280-4b68-8795-3591d7921877',0,17,'box','2026-05-03 12:28:49','2026-05-03 12:29:12'),('e4ed9a82-2043-45ae-ba7e-5aa4a3529f1f','d5463f96-3e2e-4320-889e-60022defa296',0,2,'single','2026-05-03 12:40:19','2026-05-03 15:22:10'),('e776e80e-3765-411f-9e50-a278287a1885','05cbd100-df0f-4b6e-ab05-3c18e24d2536',11,8,'box','2026-05-03 12:28:49','2026-05-03 13:05:54'),('ea2b587b-cac8-4c7e-8cec-7eae08601f76','2b08003d-8560-4843-a0b6-61ed4b171ff0',0,0,'box','2026-05-03 12:28:49','2026-05-03 12:28:49'),('f3d0a990-4013-40c2-a506-e56ea5f3a005','30d17234-3145-4541-a247-7010392ad697',1,0,'box','2026-05-03 12:28:49','2026-05-03 12:28:49'),('f4839c1c-e163-4a92-aebc-e4f1532f8911','ad4b6c51-8f01-4dd2-9206-8132d79bad01',4,14,'box','2026-05-03 12:28:49','2026-05-03 15:22:10'),('f4a1956c-b9de-42f4-8128-97b6f43c8943','599de83f-4567-406c-8fd5-53b094fad71c',0,1,'box','2026-05-03 12:21:50','2026-05-03 12:21:50');
/*!40000 ALTER TABLE `stocks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-05  9:34:28
