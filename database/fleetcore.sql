--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: maintenances_estado_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_estado_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenances_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_tipo_enum AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE'
);


--
-- Name: mechanics_estado_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mechanics_estado_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'ADMIN',
    'TECHNICIAN'
);


--
-- Name: vehicles_estado_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vehicles_estado_enum AS ENUM (
    'AVAILABLE',
    'IN_MAINTENANCE',
    'INACTIVE'
);


--
-- Name: workshops_estado_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workshops_estado_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: maintenances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenances (
    id integer NOT NULL,
    creada_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizada_en timestamp with time zone DEFAULT now() NOT NULL,
    tipo public.maintenances_tipo_enum NOT NULL,
    descripcion text NOT NULL,
    kilometraje_registrado integer NOT NULL,
    fecha_programada timestamp with time zone NOT NULL,
    duracion_estimada_minutos integer NOT NULL,
    estado public.maintenances_estado_enum DEFAULT 'SCHEDULED'::public.maintenances_estado_enum NOT NULL,
    trabajo_realizado text,
    costo_final numeric(12,2),
    fecha_finalizacion timestamp with time zone,
    kilometraje_final integer,
    vehicle_id integer NOT NULL,
    mechanic_id integer NOT NULL,
    workshop_id integer NOT NULL
);


--
-- Name: maintenances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenances_id_seq OWNED BY public.maintenances.id;


--
-- Name: mechanics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mechanics (
    id integer NOT NULL,
    creada_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizada_en timestamp with time zone DEFAULT now() NOT NULL,
    nombre character varying(120) NOT NULL,
    correo character varying(150) NOT NULL,
    especialidad character varying(120) NOT NULL,
    estado public.mechanics_estado_enum DEFAULT 'ACTIVE'::public.mechanics_estado_enum NOT NULL,
    user_id integer
);


--
-- Name: mechanics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mechanics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mechanics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mechanics_id_seq OWNED BY public.mechanics.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    creada_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizada_en timestamp with time zone DEFAULT now() NOT NULL,
    nombre character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying NOT NULL,
    role public.users_role_enum DEFAULT 'TECHNICIAN'::public.users_role_enum NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id integer NOT NULL,
    creada_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizada_en timestamp with time zone DEFAULT now() NOT NULL,
    placa character varying(15) NOT NULL,
    marca character varying(80) NOT NULL,
    modelo character varying(80) NOT NULL,
    anio integer NOT NULL,
    kilometraje integer DEFAULT 0 NOT NULL,
    estado public.vehicles_estado_enum DEFAULT 'AVAILABLE'::public.vehicles_estado_enum NOT NULL
);


--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- Name: workshops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshops (
    id integer NOT NULL,
    creada_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizada_en timestamp with time zone DEFAULT now() NOT NULL,
    nombre character varying(120) NOT NULL,
    direccion text NOT NULL,
    estado public.workshops_estado_enum DEFAULT 'ACTIVE'::public.workshops_estado_enum NOT NULL
);


--
-- Name: workshops_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workshops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workshops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workshops_id_seq OWNED BY public.workshops.id;


--
-- Name: maintenances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances ALTER COLUMN id SET DEFAULT nextval('public.maintenances_id_seq'::regclass);


--
-- Name: mechanics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics ALTER COLUMN id SET DEFAULT nextval('public.mechanics_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- Name: workshops id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops ALTER COLUMN id SET DEFAULT nextval('public.workshops_id_seq'::regclass);


--
-- Data for Name: maintenances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenances (id, creada_en, actualizada_en, tipo, descripcion, kilometraje_registrado, fecha_programada, duracion_estimada_minutos, estado, trabajo_realizado, costo_final, fecha_finalizacion, kilometraje_final, vehicle_id, mechanic_id, workshop_id) FROM stdin;
1	2026-10-27 14:14:19.648387+00	2026-10-27 14:14:19.648387+00	PREVENTIVE	Cambio de aceite y filtros	45000	2026-10-20 12:30:00+00	90	COMPLETED	Se cambió aceite 15W40, filtro de aceite y de aire	350000.00	2026-10-20 14:00:00+00	45200	1	2	1
2	2026-10-27 14:14:19.651797+00	2026-10-27 14:14:19.651797+00	CORRECTIVE	Falla en el sistema de frenos	88000	2026-10-27 12:30:00+00	180	IN_PROGRESS	\N	\N	\N	\N	3	1	1
3	2026-10-27 14:14:19.654189+00	2026-10-27 14:14:19.654189+00	PREVENTIVE	Revisión de los 30.000 km	31000	2026-11-03 13:00:00+00	120	SCHEDULED	\N	\N	\N	\N	2	2	1
\.


--
-- Data for Name: mechanics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mechanics (id, creada_en, actualizada_en, nombre, correo, especialidad, estado, user_id) FROM stdin;
1	2026-10-27 14:14:19.622627+00	2026-10-27 14:14:19.622627+00	Carlos Pérez	carlos.perez@fleetcore.com	Motores diésel	ACTIVE	2
2	2026-10-27 14:14:19.62638+00	2026-10-27 14:14:19.62638+00	Laura Gómez	laura.gomez@fleetcore.com	Frenos y suspensión	ACTIVE	3
3	2026-10-27 14:14:19.628863+00	2026-10-27 14:14:19.628863+00	Pedro Ruiz	pedro.ruiz@fleetcore.com	Sistema eléctrico	INACTIVE	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, creada_en, actualizada_en, nombre, email, password_hash, role) FROM stdin;
1	2026-10-27 14:14:19.241354+00	2026-10-27 14:14:19.241354+00	Administrador FleetCore	admin@fleetcore.com	$2b$12$MRQ2Gw1mXwpDwPYNzw33yug9YFKWA9x6zLZuK.x8sI2j8onmfc97q	ADMIN
2	2026-10-27 14:14:19.430571+00	2026-10-27 14:14:19.430571+00	Carlos Pérez	tecnico1@fleetcore.com	$2b$12$qpuPrA6n.VWIkSeYuCeXOOk2McFshcI3R3lVyYulKGtQzPKULW99m	TECHNICIAN
3	2026-10-27 14:14:19.61829+00	2026-10-27 14:14:19.61829+00	Laura Gómez	tecnico2@fleetcore.com	$2b$12$G33MUfIsQN.IfFTHcKP2rOK2qsUUh1lEa5qPIsD69zPl7PQjUXosq	TECHNICIAN
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, creada_en, actualizada_en, placa, marca, modelo, anio, kilometraje, estado) FROM stdin;
1	2026-10-27 14:14:19.636596+00	2026-10-27 14:14:19.636596+00	ABC123	Chevrolet	NHR	2021	45200	AVAILABLE
2	2026-10-27 14:14:19.639621+00	2026-10-27 14:14:19.639621+00	DEF456	Hino	Dutro	2022	31000	AVAILABLE
3	2026-10-27 14:14:19.641753+00	2026-10-27 14:14:19.641753+00	GHI789	Foton	Aumark	2020	88000	IN_MAINTENANCE
4	2026-10-27 14:14:19.643727+00	2026-10-27 14:14:19.643727+00	JKL012	JAC	N-Series	2015	210000	INACTIVE
\.


--
-- Data for Name: workshops; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workshops (id, creada_en, actualizada_en, nombre, direccion, estado) FROM stdin;
1	2026-10-27 14:14:19.631401+00	2026-10-27 14:14:19.631401+00	Taller Central	Calle 10 # 20-30, Medellín	ACTIVE
2	2026-10-27 14:14:19.633449+00	2026-10-27 14:14:19.633449+00	Taller Norte	Carrera 50 # 80-12, Bello	INACTIVE
\.


--
-- Name: maintenances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenances_id_seq', 3, true);


--
-- Name: mechanics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mechanics_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 4, true);


--
-- Name: workshops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workshops_id_seq', 2, true);


--
-- Name: vehicles PK_18d8646b59304dce4af3a9e35b6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY (id);


--
-- Name: mechanics PK_2c0ed23afc0cc7ff361c17e53df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "PK_2c0ed23afc0cc7ff361c17e53df" PRIMARY KEY (id);


--
-- Name: maintenances PK_62403473bd524a42d58589aa78b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "PK_62403473bd524a42d58589aa78b" PRIMARY KEY (id);


--
-- Name: workshops PK_6d0e82a124f5b53df91c8989848; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: mechanics REL_4e69c5d1d5ef843a571535ccfd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "REL_4e69c5d1d5ef843a571535ccfd" UNIQUE (user_id);


--
-- Name: IDX_00f176cfec58c116bac5a4a27e; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_00f176cfec58c116bac5a4a27e" ON public.vehicles USING btree (placa);


--
-- Name: IDX_1b0fec4df2703b6cbc2eabfe68; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1b0fec4df2703b6cbc2eabfe68" ON public.maintenances USING btree (vehicle_id, estado);


--
-- Name: IDX_28ea717783b935c16a0b80c398; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_28ea717783b935c16a0b80c398" ON public.maintenances USING btree (mechanic_id, estado);


--
-- Name: IDX_6043c5b9c8d47a8c771956ba92; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6043c5b9c8d47a8c771956ba92" ON public.maintenances USING btree (fecha_programada);


--
-- Name: IDX_6761651976a7e1889d4104acef; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_6761651976a7e1889d4104acef" ON public.mechanics USING btree (correo);


--
-- Name: IDX_97672ac88f789774dd47f7c8be; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON public.users USING btree (email);


--
-- Name: mechanics FK_4e69c5d1d5ef843a571535ccfde; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "FK_4e69c5d1d5ef843a571535ccfde" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maintenances FK_a47e3420d123ccf06ab72e1969c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_a47e3420d123ccf06ab72e1969c" FOREIGN KEY (workshop_id) REFERENCES public.workshops(id) ON DELETE RESTRICT;


--
-- Name: maintenances FK_d501088741618ca66074d85e411; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_d501088741618ca66074d85e411" FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;


--
-- Name: maintenances FK_f92519be34af2de954da0bd4a47; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_f92519be34af2de954da0bd4a47" FOREIGN KEY (mechanic_id) REFERENCES public.mechanics(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


