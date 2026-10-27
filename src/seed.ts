import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import {
  DataSource,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { AppModule } from './app.module.js';
import { Role } from './common/enums/role.enum.js';
import { Maintenance } from './modules/maintenances/entities/maintenance.entity.js';
import { MaintenanceStatus } from './modules/maintenances/enums/maintenance-status.enum.js';
import { MaintenanceType } from './modules/maintenances/enums/maintenance-type.enum.js';
import { Mechanic } from './modules/mechanics/entities/mechanic.entity.js';
import { MechanicStatus } from './modules/mechanics/enums/mechanic-status.enum.js';
import { User } from './modules/users/entities/user.entity.js';
import { Vehicle } from './modules/vehicles/entities/vehicle.entity.js';
import { VehicleStatus } from './modules/vehicles/enums/vehicle-status.enum.js';
import { Workshop } from './modules/workshops/entities/workshop.entity.js';
import { WorkshopStatus } from './modules/workshops/enums/workshop-status.enum.js';

// Busca el registro y solo lo crea si no existe.
// Así correr el seeder varias veces no duplica datos.
async function findOrCreate<T extends ObjectLiteral>(
  repository: Repository<T>,
  where: FindOptionsWhere<T>,
  data: Partial<T>,
): Promise<T> {
  const existing = await repository.findOneBy(where);
  if (existing) return existing;
  return repository.save(repository.create(data as T));
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  const dataSource = app.get(DataSource);
  const users = dataSource.getRepository(User);
  const mechanics = dataSource.getRepository(Mechanic);
  const workshops = dataSource.getRepository(Workshop);
  const vehicles = dataSource.getRepository(Vehicle);
  const maintenances = dataSource.getRepository(Maintenance);

  // ── Usuarios: 1 ADMIN y 2 TECHNICIAN ──
  const admin = await findOrCreate(
    users,
    { email: 'admin@fleetcore.com' },
    {
      nombre: 'Administrador FleetCore',
      email: 'admin@fleetcore.com',
      passwordHash: await bcrypt.hash('Admin123*', 12),
      role: Role.ADMIN,
    },
  );
  const tecnico1 = await findOrCreate(
    users,
    { email: 'tecnico1@fleetcore.com' },
    {
      nombre: 'Carlos Pérez',
      email: 'tecnico1@fleetcore.com',
      passwordHash: await bcrypt.hash('Tecnico123*', 12),
      role: Role.TECHNICIAN,
    },
  );
  const tecnico2 = await findOrCreate(
    users,
    { email: 'tecnico2@fleetcore.com' },
    {
      nombre: 'Laura Gómez',
      email: 'tecnico2@fleetcore.com',
      passwordHash: await bcrypt.hash('Tecnico123*', 12),
      role: Role.TECHNICIAN,
    },
  );

  // ── Mecánicos: 2 activos vinculados a los técnicos y 1 inactivo ──
  const carlos = await findOrCreate(
    mechanics,
    { correo: 'carlos.perez@fleetcore.com' },
    {
      nombre: 'Carlos Pérez',
      correo: 'carlos.perez@fleetcore.com',
      especialidad: 'Motores diésel',
      estado: MechanicStatus.ACTIVE,
      usuario: tecnico1,
    },
  );
  const laura = await findOrCreate(
    mechanics,
    { correo: 'laura.gomez@fleetcore.com' },
    {
      nombre: 'Laura Gómez',
      correo: 'laura.gomez@fleetcore.com',
      especialidad: 'Frenos y suspensión',
      estado: MechanicStatus.ACTIVE,
      usuario: tecnico2,
    },
  );
  await findOrCreate(
    mechanics,
    { correo: 'pedro.ruiz@fleetcore.com' },
    {
      nombre: 'Pedro Ruiz',
      correo: 'pedro.ruiz@fleetcore.com',
      especialidad: 'Sistema eléctrico',
      estado: MechanicStatus.INACTIVE,
    },
  );

  // ── Talleres: 1 activo y 1 inactivo ──
  const tallerCentral = await findOrCreate(
    workshops,
    { nombre: 'Taller Central' },
    {
      nombre: 'Taller Central',
      direccion: 'Calle 10 # 20-30, Medellín',
      estado: WorkshopStatus.ACTIVE,
    },
  );
  await findOrCreate(
    workshops,
    { nombre: 'Taller Norte' },
    {
      nombre: 'Taller Norte',
      direccion: 'Carrera 50 # 80-12, Bello',
      estado: WorkshopStatus.INACTIVE,
    },
  );

  // ── Vehículos: 2 AVAILABLE, 1 IN_MAINTENANCE y 1 INACTIVE ──
  const camion1 = await findOrCreate(
    vehicles,
    { placa: 'ABC123' },
    {
      placa: 'ABC123',
      marca: 'Chevrolet',
      modelo: 'NHR',
      anio: 2021,
      kilometraje: 45200,
      estado: VehicleStatus.AVAILABLE,
    },
  );
  const camion2 = await findOrCreate(
    vehicles,
    { placa: 'DEF456' },
    {
      placa: 'DEF456',
      marca: 'Hino',
      modelo: 'Dutro',
      anio: 2022,
      kilometraje: 31000,
      estado: VehicleStatus.AVAILABLE,
    },
  );
  const camion3 = await findOrCreate(
    vehicles,
    { placa: 'GHI789' },
    {
      placa: 'GHI789',
      marca: 'Foton',
      modelo: 'Aumark',
      anio: 2020,
      kilometraje: 88000,
      estado: VehicleStatus.IN_MAINTENANCE,
    },
  );
  await findOrCreate(
    vehicles,
    { placa: 'JKL012' },
    {
      placa: 'JKL012',
      marca: 'JAC',
      modelo: 'N-Series',
      anio: 2015,
      kilometraje: 210000,
      estado: VehicleStatus.INACTIVE,
    },
  );

  // ── Mantenimientos ──
  // COMPLETED: historial del vehículo ABC123
  await findOrCreate(
    maintenances,
    { vehiculo: { id: camion1.id }, descripcion: 'Cambio de aceite y filtros' },
    {
      tipo: MaintenanceType.PREVENTIVE,
      descripcion: 'Cambio de aceite y filtros',
      kilometrajeRegistrado: 45000,
      fechaProgramada: new Date('2026-10-20T07:30:00-05:00'),
      duracionEstimadaMinutos: 90,
      estado: MaintenanceStatus.COMPLETED,
      trabajoRealizado: 'Se cambió aceite 15W40, filtro de aceite y de aire',
      costoFinal: '350000.00',
      fechaFinalizacion: new Date('2026-10-20T09:00:00-05:00'),
      kilometrajeFinal: 45200,
      vehiculo: camion1,
      mecanico: laura,
      taller: tallerCentral,
    },
  );
  // IN_PROGRESS: el vehículo GHI789 está en mantenimiento
  await findOrCreate(
    maintenances,
    {
      vehiculo: { id: camion3.id },
      descripcion: 'Falla en el sistema de frenos',
    },
    {
      tipo: MaintenanceType.CORRECTIVE,
      descripcion: 'Falla en el sistema de frenos',
      kilometrajeRegistrado: 88000,
      fechaProgramada: new Date('2026-10-27T07:30:00-05:00'),
      duracionEstimadaMinutos: 180,
      estado: MaintenanceStatus.IN_PROGRESS,
      vehiculo: camion3,
      mecanico: carlos,
      taller: tallerCentral,
    },
  );
  // SCHEDULED: uno programado para probar los cambios de estado
  await findOrCreate(
    maintenances,
    { vehiculo: { id: camion2.id }, descripcion: 'Revisión de los 30.000 km' },
    {
      tipo: MaintenanceType.PREVENTIVE,
      descripcion: 'Revisión de los 30.000 km',
      kilometrajeRegistrado: 31000,
      fechaProgramada: new Date('2026-11-03T08:00:00-05:00'),
      duracionEstimadaMinutos: 120,
      estado: MaintenanceStatus.SCHEDULED,
      vehiculo: camion2,
      mecanico: laura,
      taller: tallerCentral,
    },
  );

  console.log('Seeder ejecutado. Totales en la base de datos:');
  console.log({
    usuarios: await users.count(),
    mecanicos: await mechanics.count(),
    talleres: await workshops.count(),
    vehiculos: await vehicles.count(),
    mantenimientos: await maintenances.count(),
  });
  console.log(`ADMIN: ${admin.email} / Admin123*`);
  console.log(
    'TECHNICIAN: tecnico1@fleetcore.com y tecnico2@fleetcore.com / Tecnico123*',
  );

  await app.close();
}

seed().catch((error) => {
  console.error('Error ejecutando el seeder:', error);
  process.exit(1);
});
