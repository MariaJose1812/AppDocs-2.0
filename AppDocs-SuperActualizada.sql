-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: appdocs
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `acta_entrega_detalle`
--

DROP TABLE IF EXISTS `acta_entrega_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acta_entrega_detalle` (
  `idActa_EntregaDet` int NOT NULL AUTO_INCREMENT,
  `idActa_EntregaEnc` int NOT NULL,
  `idEquipo` int NOT NULL,
  `descripcion_AEDet` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `asignado_a` varchar(80) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `observacion_AEDet` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  PRIMARY KEY (`idActa_EntregaDet`),
  UNIQUE KEY `idActa_EntregaDet_UNIQUE` (`idActa_EntregaDet`),
  KEY `idActa_EntregaEnc_idx` (`idActa_EntregaEnc`),
  KEY `FK_idEquipo_entregaDetalle_idx` (`idEquipo`),
  CONSTRAINT `idActa_EntregaEnc` FOREIGN KEY (`idActa_EntregaEnc`) REFERENCES `acta_entrega_encabezado` (`idActa_EntregaEnc`),
  CONSTRAINT `idEquipo_AEDet` FOREIGN KEY (`idEquipo`) REFERENCES `equipo` (`idEquipo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acta_entrega_detalle`
--

LOCK TABLES `acta_entrega_detalle` WRITE;
/*!40000 ALTER TABLE `acta_entrega_detalle` DISABLE KEYS */;
INSERT INTO `acta_entrega_detalle` VALUES (3,13,1,'DELL Optiplex 7020 - S/N: Ci7-16Gb-512Gb','Sara Sandoval','Se entrega con cargador original y maletín. Pantalla sin rayones.'),(4,14,1,'DELL Optiplex 7020 - S/N: Ci7-16Gb-512Gb','Sara Sandoval','Se entrega con cargador original y maletín. Pantalla sin rayones.');
/*!40000 ALTER TABLE `acta_entrega_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `acta_entrega_encabezado`
--

DROP TABLE IF EXISTS `acta_entrega_encabezado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acta_entrega_encabezado` (
  `idActa_EntregaEnc` int NOT NULL AUTO_INCREMENT,
  `correla_AEEnc` varchar(20) NOT NULL,
  `idReceptores` int DEFAULT NULL,
  `idUsuarios` int NOT NULL,
  `idEmpleados` int DEFAULT NULL,
  `asunto_AEEnc` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `fech_AEEnc` datetime NOT NULL,
  `est_AEEnc` enum('Borrador','Finalizado') NOT NULL DEFAULT 'Borrador',
  `tipo_acta` enum('Acta de Entrega','Acta de Retiro') NOT NULL DEFAULT 'Acta de Entrega',
  PRIMARY KEY (`idActa_EntregaEnc`),
  UNIQUE KEY `idActa_EntregaEnc_UNIQUE` (`idActa_EntregaEnc`),
  KEY `idReceptores_idx` (`idReceptores`),
  KEY `idUsuario_idx` (`idUsuarios`),
  KEY `fk_empleados_entregaEnc_idx` (`idEmpleados`),
  CONSTRAINT `fk_empleados_entregaEnc` FOREIGN KEY (`idEmpleados`) REFERENCES `empleados` (`idEmpleados`),
  CONSTRAINT `idReceptores` FOREIGN KEY (`idReceptores`) REFERENCES `receptores` (`idReceptores`),
  CONSTRAINT `idUsuario` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acta_entrega_encabezado`
--

LOCK TABLES `acta_entrega_encabezado` WRITE;
/*!40000 ALTER TABLE `acta_entrega_encabezado` DISABLE KEYS */;
INSERT INTO `acta_entrega_encabezado` VALUES (10,'',1,1,NULL,'Prueba 1','2026-02-19 10:21:34','Borrador','Acta de Entrega'),(13,'IT-2026-001',NULL,1,1,'Asignación de equipo por inicio de labores','2026-03-05 20:55:16','Borrador','Acta de Entrega'),(14,'IT-2026-002',NULL,1,1,'Asignación de equipo por inicio de labores','2026-03-05 21:04:43','Borrador','Acta de Entrega');
/*!40000 ALTER TABLE `acta_entrega_encabezado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `acta_recepcion_detalle`
--

DROP TABLE IF EXISTS `acta_recepcion_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acta_recepcion_detalle` (
  `idActa_RecepcionDet` int NOT NULL AUTO_INCREMENT,
  `idActa_RecepcionEnc` int NOT NULL,
  `descr_prod` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `precio_prod` decimal(10,2) NOT NULL,
  `num_recibo` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `num_fact` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `fech_ARCDet` datetime NOT NULL,
  `idEquipo` int DEFAULT NULL,
  PRIMARY KEY (`idActa_RecepcionDet`),
  UNIQUE KEY `idActa_RecepcionDet_UNIQUE` (`idActa_RecepcionDet`),
  KEY `fk_encabezadoRecep_DetalleRecep_idx` (`idActa_RecepcionEnc`),
  KEY `fk_equipo_detalleRecep_idx` (`idEquipo`),
  CONSTRAINT `fk_encabezadoRecep_DetalleRecep` FOREIGN KEY (`idActa_RecepcionEnc`) REFERENCES `acta_recepcion_encabezado` (`idActa_RecepcionEnc`),
  CONSTRAINT `fk_equipo_detalleRecep` FOREIGN KEY (`idEquipo`) REFERENCES `equipo` (`idEquipo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acta_recepcion_detalle`
--

LOCK TABLES `acta_recepcion_detalle` WRITE;
/*!40000 ALTER TABLE `acta_recepcion_detalle` DISABLE KEYS */;
INSERT INTO `acta_recepcion_detalle` VALUES (1,1,'Instagram: Alcance hasta 8000 seguidores',2418.76,'1603-0822','723482','2021-11-23 00:00:00',NULL),(2,2,'Instagram: Alcance hasta 8000 seguidores',2418.76,'1603-0822','723482','2021-11-23 00:00:00',NULL),(3,3,'Instagram: Alcance hasta 8000 seguidores',2418.76,'1603-0822','723482','2021-11-23 00:00:00',NULL),(4,4,'Instagram: Alcance hasta 8000 seguidores',2418.76,'1603-0822','723482','2021-11-23 00:00:00',NULL);
/*!40000 ALTER TABLE `acta_recepcion_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `acta_recepcion_encabezado`
--

DROP TABLE IF EXISTS `acta_recepcion_encabezado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acta_recepcion_encabezado` (
  `idActa_RecepcionEnc` int NOT NULL AUTO_INCREMENT,
  `correla_ARCEnc` varchar(20) NOT NULL,
  `idUsuarios` int NOT NULL,
  `idReceptores` int DEFAULT NULL,
  `idEmpleados` int DEFAULT NULL,
  `desc_ARCEnc` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `est_ARCEnc` enum('Borrador','Finalizado') NOT NULL DEFAULT 'Borrador',
  PRIMARY KEY (`idActa_RecepcionEnc`),
  UNIQUE KEY `idActa_RecepcionEnc_UNIQUE` (`idActa_RecepcionEnc`),
  KEY `fk_usuarios_RecepcionDetalle_idx` (`idUsuarios`),
  KEY `fk_receptores_RecepcionDetalle_idx` (`idReceptores`),
  KEY `fk_empleados_recepcionEnc_idx` (`idEmpleados`),
  CONSTRAINT `fk_empleados_recepcionEnc` FOREIGN KEY (`idEmpleados`) REFERENCES `empleados` (`idEmpleados`),
  CONSTRAINT `fk_receptores_RecepcionDetalle` FOREIGN KEY (`idReceptores`) REFERENCES `receptores` (`idReceptores`),
  CONSTRAINT `fk_usuarios_RecepcionDetalle` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acta_recepcion_encabezado`
--

LOCK TABLES `acta_recepcion_encabezado` WRITE;
/*!40000 ALTER TABLE `acta_recepcion_encabezado` DISABLE KEYS */;
INSERT INTO `acta_recepcion_encabezado` VALUES (1,'IT-2026-001',1,2,NULL,'Recepción de producto digital - Potenciadores de redes','Borrador'),(2,'IT-2026-002',1,1,NULL,'Recepción de producto digital - Potenciadores de redes','Borrador'),(3,'IT-2026-003',1,1,NULL,'Potenciadores de redes','Borrador'),(4,'IT-2026-004',2,1,NULL,'Potenciadores de redes','Borrador');
/*!40000 ALTER TABLE `acta_recepcion_encabezado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `acta_retiro_detalle`
--

DROP TABLE IF EXISTS `acta_retiro_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acta_retiro_detalle` (
  `idActa_RetiroDet` int NOT NULL AUTO_INCREMENT,
  `idActa_RetiroEnc` int NOT NULL,
  `desc_ARDet` varchar(500) NOT NULL,
  `observa_ARDet` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `idEquipo` int NOT NULL,
  PRIMARY KEY (`idActa_RetiroDet`),
  UNIQUE KEY `idActa_RetiroDet_UNIQUE` (`idActa_RetiroDet`),
  KEY `fk_encabezado_detalle_idx` (`idActa_RetiroEnc`),
  KEY `fk_equipo_retiroDet_idx` (`idEquipo`),
  CONSTRAINT `fk_encabezado_detalle` FOREIGN KEY (`idActa_RetiroEnc`) REFERENCES `acta_retiro_encabezado` (`idActa_RetiroEnc`),
  CONSTRAINT `fk_equipo_retiroDet` FOREIGN KEY (`idEquipo`) REFERENCES `equipo` (`idEquipo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acta_retiro_detalle`
--

LOCK TABLES `acta_retiro_detalle` WRITE;
/*!40000 ALTER TABLE `acta_retiro_detalle` DISABLE KEYS */;
INSERT INTO `acta_retiro_detalle` VALUES (1,1,'DELL Optiplex 7020 - S/N: Ci7-16Gb-512Gb','Usuario reporta lentitud. Se retira para diagnóstico de disco duro y memoria RAM.',1);
/*!40000 ALTER TABLE `acta_retiro_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `acta_retiro_encabezado`
--

DROP TABLE IF EXISTS `acta_retiro_encabezado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acta_retiro_encabezado` (
  `idActa_RetiroEnc` int NOT NULL AUTO_INCREMENT,
  `correla_AREnc` varchar(20) NOT NULL,
  `idUsuarios` int NOT NULL,
  `idReceptores` int DEFAULT NULL,
  `idEmpleados` int DEFAULT NULL,
  `asunto_AREnc` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `fech_AREnc` datetime NOT NULL,
  `est_AREnc` enum('Borrador','Finalizado') NOT NULL DEFAULT 'Borrador',
  PRIMARY KEY (`idActa_RetiroEnc`),
  UNIQUE KEY `idActa_RetiroEnc_UNIQUE` (`idActa_RetiroEnc`),
  KEY `idreceptores_idx` (`idReceptores`),
  KEY `fk_usuarios_idx` (`idUsuarios`),
  KEY `fk_empleados_retiroEnc_idx` (`idEmpleados`),
  CONSTRAINT `fk_empleados_retiroEnc` FOREIGN KEY (`idEmpleados`) REFERENCES `empleados` (`idEmpleados`),
  CONSTRAINT `fk_receptores` FOREIGN KEY (`idReceptores`) REFERENCES `receptores` (`idReceptores`),
  CONSTRAINT `fk_usuarios` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acta_retiro_encabezado`
--

LOCK TABLES `acta_retiro_encabezado` WRITE;
/*!40000 ALTER TABLE `acta_retiro_encabezado` DISABLE KEYS */;
INSERT INTO `acta_retiro_encabezado` VALUES (1,'IT-2026-001',1,NULL,1,'Retiro de equipo para revisión técnica','2026-03-05 21:08:17','Borrador');
/*!40000 ALTER TABLE `acta_retiro_encabezado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitácora`
--

DROP TABLE IF EXISTS `bitácora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitácora` (
  `idBitácora` int NOT NULL AUTO_INCREMENT,
  `fechBit` datetime NOT NULL,
  `tipo_acta` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `accBit` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `idUsuarios` int NOT NULL,
  PRIMARY KEY (`idBitácora`),
  UNIQUE KEY `idBitácora_UNIQUE` (`idBitácora`),
  KEY `idUsuarios_idx` (`idUsuarios`),
  CONSTRAINT `idUsuarios` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitácora`
--

LOCK TABLES `bitácora` WRITE;
/*!40000 ALTER TABLE `bitácora` DISABLE KEYS */;
/*!40000 ALTER TABLE `bitácora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleados`
--

DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleados` (
  `idEmpleados` int NOT NULL AUTO_INCREMENT,
  `nomEmp` varchar(50) NOT NULL,
  `corEmp` varchar(80) NOT NULL,
  `idOficina` int NOT NULL,
  `cargoEmp` varchar(50) NOT NULL,
  `dniEmp` varchar(15) NOT NULL,
  `estEmp` enum('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`idEmpleados`),
  UNIQUE KEY `idEmpleados_UNIQUE` (`idEmpleados`),
  KEY `fk_oficina_empleados_idx` (`idOficina`),
  CONSTRAINT `fk_oficina_empleados` FOREIGN KEY (`idOficina`) REFERENCES `oficina` (`idOficina`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleados`
--

LOCK TABLES `empleados` WRITE;
/*!40000 ALTER TABLE `empleados` DISABLE KEYS */;
INSERT INTO `empleados` VALUES (1,'Sara Sandoval','sarasandoval@conadeh.hn',1,'Jefe en área','0801-1975-99873','Activo');
/*!40000 ALTER TABLE `empleados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipo`
--

DROP TABLE IF EXISTS `equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipo` (
  `idEquipo` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(30) NOT NULL,
  `marca` varchar(30) NOT NULL,
  `modelo` varchar(45) NOT NULL,
  `serie` varchar(45) NOT NULL,
  `numFich` varchar(20) DEFAULT NULL,
  `numInv` varchar(25) DEFAULT NULL,
  PRIMARY KEY (`idEquipo`),
  UNIQUE KEY `idequipo_UNIQUE` (`idEquipo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipo`
--

LOCK TABLES `equipo` WRITE;
/*!40000 ALTER TABLE `equipo` DISABLE KEYS */;
INSERT INTO `equipo` VALUES (1,'CPU','DELL','Optiplex 7020','Ci7-16Gb-512Gb','4567',NULL),(2,'CPU','DELL','Optiplex 2030','Ci7-16Gb-512Gb',NULL,'47738329');
/*!40000 ALTER TABLE `equipo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memorandum_detalle`
--

DROP TABLE IF EXISTS `memorandum_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memorandum_detalle` (
  `idMemoDet` int NOT NULL AUTO_INCREMENT,
  `idMemoEnc` int NOT NULL,
  `desc_MMDet` varchar(500) NOT NULL,
  PRIMARY KEY (`idMemoDet`),
  UNIQUE KEY `idMemoDet_UNIQUE` (`idMemoDet`),
  KEY `fk_MMEnc_MMDet_idx` (`idMemoEnc`),
  CONSTRAINT `fk_MMEnc_MMDet` FOREIGN KEY (`idMemoEnc`) REFERENCES `memorandum_encabezado` (`idMemoEnc`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memorandum_detalle`
--

LOCK TABLES `memorandum_detalle` WRITE;
/*!40000 ALTER TABLE `memorandum_detalle` DISABLE KEYS */;
INSERT INTO `memorandum_detalle` VALUES (1,3,'Por este medio se le informa que el día sábado 07 de marzo se realizará un mantenimiento preventivo a los servidores principales.'),(2,3,'Los sistemas internos y la intranet experimentarán interrupciones intermitentes entre las 08:00 AM y las 12:00 PM.'),(3,3,'Le solicitamos tomar las medidas necesarias y guardar su trabajo con anticipación.'),(4,4,'Por este medio se le informa que el día sábado 07 de febrero se realizará un mantenimiento preventivo a los servidores principales.'),(5,4,'Le solicitamos tomar las medidas necesarias y guardar su trabajo con anticipación.'),(6,5,'Por este medio se le informa que el día sábado 07 de febrero se realizará un mantenimiento preventivo a los servidores principales.'),(7,5,'Le solicitamos tomar las medidas necesarias y guardar su trabajo con anticipación.');
/*!40000 ALTER TABLE `memorandum_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memorandum_encabezado`
--

DROP TABLE IF EXISTS `memorandum_encabezado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memorandum_encabezado` (
  `idMemoEnc` int NOT NULL AUTO_INCREMENT,
  `correla_MMEnc` varchar(20) NOT NULL,
  `idEmpleados` int DEFAULT NULL,
  `idReceptores` int DEFAULT NULL,
  `idUsuarios` int NOT NULL,
  `fech_MMEnc` datetime NOT NULL,
  `asunto_MMEnc` varchar(50) NOT NULL,
  `est_MMEnc` enum('Borrador','Finalizado') NOT NULL DEFAULT 'Borrador',
  PRIMARY KEY (`idMemoEnc`),
  UNIQUE KEY `idMemoEnc_UNIQUE` (`idMemoEnc`),
  KEY `fk_empleados_MMEnc_idx` (`idEmpleados`),
  KEY `fk_usuarios_MMEnc_idx` (`idUsuarios`),
  KEY `fk_receptores_MMEnc_idx` (`idReceptores`),
  CONSTRAINT `fk_empleados_MMEnc` FOREIGN KEY (`idEmpleados`) REFERENCES `empleados` (`idEmpleados`),
  CONSTRAINT `fk_receptores_MMEnc` FOREIGN KEY (`idReceptores`) REFERENCES `receptores` (`idReceptores`),
  CONSTRAINT `fk_usuarios_MMEnc` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memorandum_encabezado`
--

LOCK TABLES `memorandum_encabezado` WRITE;
/*!40000 ALTER TABLE `memorandum_encabezado` DISABLE KEYS */;
INSERT INTO `memorandum_encabezado` VALUES (3,'IT-2026-001',1,NULL,1,'2026-03-05 19:47:29','Notificación de Mantenimiento a Servidores','Borrador'),(4,'IT-2026-002',1,NULL,1,'2026-03-05 19:50:47','Notificación de Mantenimiento a Computadoras','Borrador'),(5,'IT-2026-003',1,NULL,1,'2026-03-05 20:39:05','Notificación de Mantenimiento a Equipo Informático','Borrador');
/*!40000 ALTER TABLE `memorandum_encabezado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oficina`
--

DROP TABLE IF EXISTS `oficina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oficina` (
  `idOficina` int NOT NULL AUTO_INCREMENT,
  `nomOficina` varchar(50) NOT NULL,
  `unidad` varchar(60) NOT NULL,
  `cargoOfi` varchar(50) NOT NULL,
  PRIMARY KEY (`idOficina`),
  UNIQUE KEY `idEmpleados_UNIQUE` (`idOficina`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oficina`
--

LOCK TABLES `oficina` WRITE;
/*!40000 ALTER TABLE `oficina` DISABLE KEYS */;
INSERT INTO `oficina` VALUES (1,'Oficina ORCO','Investigacion','jefe');
/*!40000 ALTER TABLE `oficina` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oficios_detalle`
--

DROP TABLE IF EXISTS `oficios_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oficios_detalle` (
  `idOfiDet` int NOT NULL AUTO_INCREMENT,
  `idOfiEnc` int NOT NULL,
  `desc_OfiDet` varchar(500) NOT NULL,
  PRIMARY KEY (`idOfiDet`),
  UNIQUE KEY `idOfiDet_UNIQUE` (`idOfiDet`),
  KEY `fk_oficiosEnc_oficiosDet_idx` (`idOfiEnc`),
  CONSTRAINT `fk_oficiosEnc_oficiosDet` FOREIGN KEY (`idOfiEnc`) REFERENCES `oficios_encabezado` (`idOfiEnc`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oficios_detalle`
--

LOCK TABLES `oficios_detalle` WRITE;
/*!40000 ALTER TABLE `oficios_detalle` DISABLE KEYS */;
INSERT INTO `oficios_detalle` VALUES (1,2,'Por medio del presente oficio se solicita formalmente la validación del equipo de cómputo para el área a su cargo.'),(2,2,'Se requiere que confirme la cantidad de colaboradores que necesitarán estaciones de trabajo de escritorio versus laptops.'),(3,2,'Agradeceremos enviar su respuesta firmada a más tardar el día viernes de esta semana.'),(4,3,'Por medio del presente oficio se solicita formalmente la validación del equipo de cómputo para el área a su cargo.'),(5,3,'Se requiere que confirme la cantidad de colaboradores que necesitarán estaciones de trabajo de escritorio versus laptops.'),(6,3,'Agradeceremos enviar su respuesta firmada a más tardar el día viernes de esta semana.'),(7,4,'Por medio del presente oficio se solicita formalmente la validación del equipo de cómputo para el área a su cargo.'),(8,4,'Agradeceremos enviar su respuesta firmada a más tardar el día viernes de esta semana.');
/*!40000 ALTER TABLE `oficios_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oficios_encabezado`
--

DROP TABLE IF EXISTS `oficios_encabezado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oficios_encabezado` (
  `idOfiEnc` int NOT NULL AUTO_INCREMENT,
  `correla_OFIEnc` varchar(20) NOT NULL,
  `idEmpleados` int DEFAULT NULL,
  `idReceptores` int DEFAULT NULL,
  `idUsuarios` int NOT NULL,
  `fech_OFIEnc` datetime NOT NULL,
  `asunto_OFIEnc` varchar(50) NOT NULL,
  `est_OFIEnc` enum('Borrador','Finalizado') NOT NULL DEFAULT 'Borrador',
  PRIMARY KEY (`idOfiEnc`),
  UNIQUE KEY `idOfiEnc_UNIQUE` (`idOfiEnc`),
  KEY `fk_empleados_oficiosEnc_idx` (`idEmpleados`),
  KEY `fk_receptores_oficiosEnc_idx` (`idReceptores`),
  KEY `fk_usuarios_oficiosEnc_idx` (`idUsuarios`),
  CONSTRAINT `fk_empleados_oficiosEnc` FOREIGN KEY (`idEmpleados`) REFERENCES `empleados` (`idEmpleados`),
  CONSTRAINT `fk_receptores_oficiosEnc` FOREIGN KEY (`idReceptores`) REFERENCES `receptores` (`idReceptores`),
  CONSTRAINT `fk_usuarios_oficiosEnc` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oficios_encabezado`
--

LOCK TABLES `oficios_encabezado` WRITE;
/*!40000 ALTER TABLE `oficios_encabezado` DISABLE KEYS */;
INSERT INTO `oficios_encabezado` VALUES (2,'IT-2026-001',1,NULL,1,'2026-03-05 20:05:38','Requerimiento de Equipo de Cómputo','Borrador'),(3,'IT-2026-002',NULL,3,1,'2026-03-05 20:07:48','Requerimiento de Equipo de Cómputo','Borrador'),(4,'IT-2026-003',NULL,2,1,'2026-03-05 20:40:17','Requerimiento de Cómputo','Borrador');
/*!40000 ALTER TABLE `oficios_encabezado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pase_salida_detalle`
--

DROP TABLE IF EXISTS `pase_salida_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pase_salida_detalle` (
  `idPase_SalidaDet` int NOT NULL AUTO_INCREMENT,
  `idPase_SalidaEnc` int NOT NULL,
  `idEquipo` int NOT NULL,
  PRIMARY KEY (`idPase_SalidaDet`),
  UNIQUE KEY `idPase_SalidaDet_UNIQUE` (`idPase_SalidaDet`),
  KEY `fk_encabezadoPS_detallePS_idx` (`idPase_SalidaEnc`),
  KEY `fk_equipo_PSDet_idx` (`idEquipo`),
  CONSTRAINT `fk_encabezadoPS_detallePS` FOREIGN KEY (`idPase_SalidaEnc`) REFERENCES `pase_salida_encabezado` (`idPase_SalidaEnc`),
  CONSTRAINT `fk_equipo_PSDet` FOREIGN KEY (`idEquipo`) REFERENCES `equipo` (`idEquipo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pase_salida_detalle`
--

LOCK TABLES `pase_salida_detalle` WRITE;
/*!40000 ALTER TABLE `pase_salida_detalle` DISABLE KEYS */;
INSERT INTO `pase_salida_detalle` VALUES (1,1,2),(2,5,2),(3,6,1),(4,8,1),(5,9,2),(6,10,2);
/*!40000 ALTER TABLE `pase_salida_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pase_salida_encabezado`
--

DROP TABLE IF EXISTS `pase_salida_encabezado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pase_salida_encabezado` (
  `idPase_SalidaEnc` int NOT NULL AUTO_INCREMENT,
  `correla_PSEnc` varchar(20) NOT NULL,
  `idReceptores` int DEFAULT NULL,
  `idEmpleados` int DEFAULT NULL,
  `idUsuarios` int NOT NULL,
  `emp_PSEnc` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `motivo_PSEnc` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `fech_PSEnc` datetime NOT NULL,
  `est_PSEnc` enum('Borrador','Finalizado') NOT NULL DEFAULT 'Borrador',
  PRIMARY KEY (`idPase_SalidaEnc`),
  UNIQUE KEY `idPase_SalidaEnc_UNIQUE` (`idPase_SalidaEnc`),
  KEY `fk_receptores_PaseSalidaEnc_idx` (`idReceptores`),
  KEY `fk_usuarios_PaseSalida_idx` (`idUsuarios`),
  KEY `fk_empleados_PSEnc_idx` (`idEmpleados`),
  CONSTRAINT `fk_empleados_PSEnc` FOREIGN KEY (`idEmpleados`) REFERENCES `empleados` (`idEmpleados`),
  CONSTRAINT `fk_receptores_PaseSalidaEnc` FOREIGN KEY (`idReceptores`) REFERENCES `receptores` (`idReceptores`),
  CONSTRAINT `fk_usuarios_PaseSalida` FOREIGN KEY (`idUsuarios`) REFERENCES `usuarios` (`idUsuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pase_salida_encabezado`
--

LOCK TABLES `pase_salida_encabezado` WRITE;
/*!40000 ALTER TABLE `pase_salida_encabezado` DISABLE KEYS */;
INSERT INTO `pase_salida_encabezado` VALUES (1,'IT-2026-001',2,NULL,1,'Soporte Técnico Externo S.A.','llevar equipo a reparación por falla en la placa base','2026-03-05 18:59:42','Borrador'),(5,'IT-2026-002',2,NULL,1,'Soporte Técnico Externo S.A.','llevar equipo a reparación por falla en la placa base','2026-03-05 19:12:54','Borrador'),(6,'IT-2026-003',1,NULL,1,'Soporte Técnico Externo S.A.','llevar equipo a reparación por falla en la placa base','2026-03-05 19:15:06','Borrador'),(8,'IT-2026-004',1,NULL,1,'Soporte Técnico Externo S.A.','llevar equipo a reparación por falla en la placa base','2026-03-05 19:20:21','Borrador'),(9,'IT-2026-005',2,NULL,2,'Soporte Técnico','hola','2026-03-05 19:21:17','Borrador'),(10,'IT-2026-006',2,NULL,3,'Soporte Técnico','sllalalla','2026-03-05 20:37:49','Borrador');
/*!40000 ALTER TABLE `pase_salida_encabezado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receptores`
--

DROP TABLE IF EXISTS `receptores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receptores` (
  `idReceptores` int NOT NULL AUTO_INCREMENT,
  `nomRec` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `corRec` varchar(80) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `emprRec` varchar(100) NOT NULL,
  `cargoRec` varchar(100) NOT NULL,
  PRIMARY KEY (`idReceptores`),
  UNIQUE KEY `idReceptores_UNIQUE` (`idReceptores`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receptores`
--

LOCK TABLES `receptores` WRITE;
/*!40000 ALTER TABLE `receptores` DISABLE KEYS */;
INSERT INTO `receptores` VALUES (1,'Luis Enrique Castellanos','luis12@gmail.com','Empresa de Sistemas Digitales en Computación','Jefe Sistemas'),(2,'Katia Mejia','katy@gmail.com','Oficina Juridica','Asistente Legal'),(3,'Ulises Fonseca','ulifon@gmail.com','Centromatic','Gerente');
/*!40000 ALTER TABLE `receptores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportes_detalle`
--

DROP TABLE IF EXISTS `reportes_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reportes_detalle` (
  `idRepDet` int NOT NULL AUTO_INCREMENT,
  `idRepEnc` int NOT NULL,
  `idEquipo` int NOT NULL,
  `motivo_RpDet` varchar(500) NOT NULL,
  `diagnostic_RpDet` varchar(500) NOT NULL,
  `recomen_RpDet` varchar(500) NOT NULL,
  `asignado_a` varchar(80) NOT NULL,
  PRIMARY KEY (`idRepDet`),
  UNIQUE KEY `idRepEnc_UNIQUE` (`idRepDet`),
  KEY `fk_reportesEnc_reportesDet_idx` (`idRepEnc`),
  KEY `fk_equipo_reportesDet_idx` (`idEquipo`),
  CONSTRAINT `fk_equipo_reportesDet` FOREIGN KEY (`idEquipo`) REFERENCES `equipo` (`idEquipo`),
  CONSTRAINT `fk_reportesEnc_reportesDet` FOREIGN KEY (`idRepEnc`) REFERENCES `reportes_encabezado` (`idRepEnc`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportes_detalle`
--

LOCK TABLES `reportes_detalle` WRITE;
/*!40000 ALTER TABLE `reportes_detalle` DISABLE KEYS */;
INSERT INTO `reportes_detalle` VALUES (1,3,1,'El equipo de cómputo no enciende y emite pitidos continuos al presionar el botón de poder.','Fallo en el módulo principal de memoria RAM. Acumulación excesiva de polvo en los disipadores.','Se recomienda el reemplazo inmediato de la memoria RAM de 8GB y realizar un mantenimiento preventivo general.','Marco Aguilera'),(2,4,2,'El equipo de cómputo no enciende y emite pitidos continuos al presionar el botón de poder.','Fallo en el módulo principal de memoria RAM. Acumulación excesiva de polvo en los disipadores.','Se recomienda el reemplazo inmediato de la memoria RAM de 8GB y realizar un mantenimiento preventivo general.','Marco Aguilera'),(3,5,2,'El equipo de cómputo no enciende y emite pitidos continuos al presionar el botón de poder.','Fallo en el módulo principal de memoria RAM. Acumulación excesiva de polvo en los disipadores.','Se recomienda el reemplazo inmediato de la memoria RAM de 8GB y realizar un mantenimiento preventivo general.','Marco Aguiler'),(4,6,2,'El equipo de cómputo no enciende y emite pitidos continuos al presionar el botón de poder.','Fallo en el módulo principal de memoria RAM. Acumulación excesiva de polvo en los disipadores.','Se recomienda el reemplazo inmediato de la memoria RAM de 8GB y realizar un mantenimiento preventivo general.','Oscar');
/*!40000 ALTER TABLE `reportes_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportes_encabezado`
--

DROP TABLE IF EXISTS `reportes_encabezado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reportes_encabezado` (
  `idRepEnc` int NOT NULL AUTO_INCREMENT,
  `correla_RpEnc` varchar(20) NOT NULL,
  `fech_RpEnc` datetime NOT NULL,
  `est_RpEnc` enum('Borrador','Finalizado') NOT NULL DEFAULT 'Borrador',
  PRIMARY KEY (`idRepEnc`),
  UNIQUE KEY `idRepEnc_UNIQUE` (`idRepEnc`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportes_encabezado`
--

LOCK TABLES `reportes_encabezado` WRITE;
/*!40000 ALTER TABLE `reportes_encabezado` DISABLE KEYS */;
INSERT INTO `reportes_encabezado` VALUES (3,'IT-2026-001','2026-03-05 20:22:13','Borrador'),(4,'IT-2026-002','2026-03-05 20:40:53','Borrador'),(5,'IT-2026-003','2026-03-05 20:41:09','Borrador'),(6,'IT-2026-004','2026-03-05 20:41:24','Borrador');
/*!40000 ALTER TABLE `reportes_encabezado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportes_img`
--

DROP TABLE IF EXISTS `reportes_img`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reportes_img` (
  `idRepImg` int NOT NULL,
  `idRepDet` int NOT NULL,
  `ruta_img` varchar(255) NOT NULL,
  PRIMARY KEY (`idRepImg`),
  KEY `fk_repDet_repImg_idx` (`idRepDet`),
  CONSTRAINT `fk_repDet_repImg` FOREIGN KEY (`idRepDet`) REFERENCES `reportes_detalle` (`idRepDet`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportes_img`
--

LOCK TABLES `reportes_img` WRITE;
/*!40000 ALTER TABLE `reportes_img` DISABLE KEYS */;
/*!40000 ALTER TABLE `reportes_img` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `idUsuarios` int NOT NULL AUTO_INCREMENT,
  `nomUsu` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `corUsu` varchar(80) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cargoUsu` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `conUsu` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idUsuarios`),
  UNIQUE KEY `idUsuarios_UNIQUE` (`idUsuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Marco Aguilera','marcoaguilera@gmail.com','Jefe Infotecnologia','conadeh123'),(2,'Diego Zavala','diegoz@gmail.com','Asistente IT','cndh6789'),(3,'Ronald Moncada','ronaldmon@conadeh.hn','Asistente IT','con@dh2026'),(4,'Ing. Roberto Gomez','roberto@empresa.com','Soporte Técnico IT','$2b$10$rsLkzlK.9/rp.EA3N.nwouUGnUu0zmaH8dAwfkWc787zPybmyJTuO');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-09 10:19:02
