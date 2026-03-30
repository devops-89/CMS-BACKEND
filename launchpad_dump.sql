--
-- PostgreSQL database dump
--

\restrict yqIZp2RJUwNRkVQfmeReUtFqdGx4oIkodpgsMziiiYpEOEzgiUy14C7VMAdc1tt

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: otps_type_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.otps_type_enum AS ENUM (
    'PASSWORD_RESET'
);


ALTER TYPE public.otps_type_enum OWNER TO admin;

--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.users_role_enum AS ENUM (
    'admin',
    'judge',
    'participant',
    'moderator'
);


ALTER TYPE public.users_role_enum OWNER TO admin;

--
-- Name: users_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.users_status_enum AS ENUM (
    'Active',
    'Inactive',
    'Suspended',
    'Pending',
    'Banned',
    'Rejected',
    'Upcoming',
    'Completed',
    'Offline',
    'Published',
    'Draft'
);


ALTER TYPE public.users_status_enum OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_profile; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.admin_profile (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "adminCode" character varying,
    "isActive" boolean DEFAULT true NOT NULL,
    department character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" uuid
);


ALTER TABLE public.admin_profile OWNER TO admin;

--
-- Name: form_submissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.form_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    data jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    template_id uuid
);


ALTER TABLE public.form_submissions OWNER TO admin;

--
-- Name: form_templates; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.form_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    schema jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.form_templates OWNER TO admin;

--
-- Name: judge_profile; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.judge_profile (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "judgeLicense" character varying,
    specialization character varying,
    "isActive" boolean DEFAULT true NOT NULL,
    "totalEvaluations" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" uuid
);


ALTER TABLE public.judge_profile OWNER TO admin;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO admin;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO admin;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: otps; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.otps (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id character varying NOT NULL,
    otp text NOT NULL,
    type public.otps_type_enum DEFAULT 'PASSWORD_RESET'::public.otps_type_enum NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    "isUsed" boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.otps OWNER TO admin;

--
-- Name: participant_profiles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.participant_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "dateOfBirth" timestamp without time zone NOT NULL,
    country character varying NOT NULL,
    "schoolName" character varying NOT NULL,
    grade character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" uuid
);


ALTER TABLE public.participant_profiles OWNER TO admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id character varying NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "avatarUrl" character varying,
    "firstName" character varying NOT NULL,
    "lastName" character varying NOT NULL,
    phone character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    role public.users_role_enum NOT NULL,
    status public.users_status_enum DEFAULT 'Active'::public.users_status_enum NOT NULL
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: admin_profile; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.admin_profile (id, "adminCode", "isActive", department, "createdAt", "userId") FROM stdin;
09466e08-8ae9-4da5-808b-c15dc983fa84	\N	t	\N	2026-03-19 11:22:41.301673	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94
\.


--
-- Data for Name: form_submissions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.form_submissions (id, data, "createdAt", template_id) FROM stdin;
\.


--
-- Data for Name: form_templates; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.form_templates (id, name, schema, "isActive", version, "createdAt", "updatedAt") FROM stdin;
c86b705c-5054-44f5-954d-43e230c95192	registration_form_2025	{"fields": [{"id": "phone_1", "type": "telInput", "label": "Phone Number", "config": {"onlyCountries": ["AE", "SA"], "defaultCountry": "AE"}, "variant": "outlined", "required": true}, {"id": "name_1", "type": "textfield", "label": "Full Name", "variant": "outlined", "required": true}, {"id": "country_1", "type": "select", "label": "Country", "options": ["India", "UAE", "USA"], "required": true}], "form_identity": {"name": "registration_form_2025", "title": "UAE Grand Event 2025", "timestamp": "2026-03-24T08:21:44Z"}}	t	1	2026-03-24 11:47:51.362186	2026-03-24 11:47:51.362186
acac5955-a799-48f8-b225-000d331e2f9e	registration form uae	{"fields": [{"id": "dejqoquh1", "type": "textfield", "label": "Name", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "wvufkq7f5", "type": "telInput", "label": "Text Input 2", "config": {}, "options": [], "variant": "outlined", "required": false}], "form_identity": {"name": "registration form uae", "title": "UAE's Top Young Innvovators 2025", "timestamp": "2026-03-24T12:35:26.055Z"}}	t	1	2026-03-24 12:35:26.390975	2026-03-24 12:35:26.390975
1967dd46-bd01-4a3d-a2db-59a4c144dff3	registration form uae	{"fields": [{"id": "dejqoquh1", "type": "textfield", "label": "Name", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "wvufkq7f5", "type": "telInput", "label": "Text Input 2", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "geo92aj43", "type": "numberField", "label": "Number Input 3", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "e4e5m8cu1", "type": "datePicker", "label": "Date Selection 4", "config": {"disablePast": false, "disableFuture": false}, "options": [], "variant": "outlined", "required": false}, {"id": "jpqa3ruyy", "type": "countrySelector", "label": "Global Countries 5", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "ogkpzdvnl", "type": "autocomplete", "label": "Smart Search 6", "config": {}, "options": ["Option 1", "Option 2"], "variant": "outlined", "required": false}, {"id": "bcnulezp3", "type": "select", "label": "Dropdown Menu 7", "config": {}, "options": ["Option 1", "Option 2"], "variant": "outlined", "required": false}, {"id": "1vi2yla6i", "type": "radio", "label": "Radio Group 8", "config": {}, "options": ["Option 1", "Option 2"], "variant": "outlined", "required": false}, {"id": "qow5rortd", "type": "checkbox", "label": "Toggle Box 9", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "yox1tsikr", "type": "switch", "label": "Switch Key 10", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "xc15gu0bs", "type": "slider", "label": "Range Slider 11", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "ttij5s7kl", "type": "rating", "label": "Visual Rating 12", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "sm0arq05u", "type": "button", "label": "Primary Button 13", "config": {}, "options": [], "variant": "outlined", "required": false}], "form_identity": {"name": "registration form uae", "title": "UAE's Top Young Innvovators 2025", "timestamp": "2026-03-26T18:50:18.034Z"}}	t	1	2026-03-26 18:50:19.187868	2026-03-26 18:50:19.187868
61324b4c-db84-42c4-b813-446d16f692ae	registration form uae	{"fields": [{"id": "dejqoquh1", "type": "textfield", "label": "Name", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "wvufkq7f5", "type": "telInput", "label": "Text Input 2", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "geo92aj43", "type": "numberField", "label": "Number Input 3", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "e4e5m8cu1", "type": "datePicker", "label": "Date Selection 4", "config": {"disablePast": false, "disableFuture": false}, "options": [], "variant": "outlined", "required": false}, {"id": "jpqa3ruyy", "type": "countrySelector", "label": "Global Countries 5", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "ogkpzdvnl", "type": "autocomplete", "label": "Smart Search 6", "config": {}, "options": ["Option 1", "Option 2"], "variant": "outlined", "required": false}, {"id": "bcnulezp3", "type": "select", "label": "Dropdown Menu 7", "config": {}, "options": ["Option 1", "Option 2"], "variant": "outlined", "required": false}, {"id": "1vi2yla6i", "type": "radio", "label": "Radio Group 8", "config": {}, "options": ["Option 1", "Option 2"], "variant": "outlined", "required": false}, {"id": "qow5rortd", "type": "checkbox", "label": "Toggle Box 9", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "yox1tsikr", "type": "switch", "label": "Switch Key 10", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "xc15gu0bs", "type": "slider", "label": "Range Slider 11", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "ttij5s7kl", "type": "rating", "label": "Visual Rating 12", "config": {}, "options": [], "variant": "outlined", "required": false}, {"id": "sm0arq05u", "type": "button", "label": "Primary Button 13", "config": {}, "options": [], "variant": "outlined", "required": false}], "form_identity": {"name": "registration form uae", "title": "UAE's Top Young Innvovators 2025", "timestamp": "2026-03-26T18:51:30.768Z"}}	t	1	2026-03-26 18:51:31.252992	2026-03-26 18:51:31.252992
\.


--
-- Data for Name: judge_profile; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.judge_profile (id, "judgeLicense", specialization, "isActive", "totalEvaluations", "createdAt", "userId") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1773995185681	Migration1773995185681
2	1774340223253	Migration1774340223253
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.otps (id, user_id, otp, type, expires_at, "isUsed", created_at) FROM stdin;
99f0c96b-63fd-43fc-a178-fb31d9930e66	4ac90870-b341-4f52-9616-8f7bfc0a1bf0	$2b$10$zKIvO0n6wUKjxwX2OFo6q.FHDGjLUHx3LqmwHzCQQRk1seypx81Xa	PASSWORD_RESET	2026-03-19 11:46:31.007	t	2026-03-19 11:41:31.008766
\.


--
-- Data for Name: participant_profiles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.participant_profiles (id, "dateOfBirth", country, "schoolName", grade, "createdAt", "userId") FROM stdin;
35a9da6e-cb0d-45b8-98a2-55aed7bf5251	2005-06-15 00:00:00	India	ABC Public School	10	2026-03-19 11:24:20.146489	4ac90870-b341-4f52-9616-8f7bfc0a1bf0
98af272d-f634-4d9a-9f17-890c82a72679	2001-05-31 00:00:00	India	TEst	Year 11/Grade 10	2026-03-19 15:26:32.87667	9575cefe-1669-4b08-882a-1fcd670be30f
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
f51eb209-4069-485a-a778-91fa5be98a95	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzM5MTk1MDIsImV4cCI6MTc3NDUyNDMwMn0.9CQc3kjS_CkbYyxQ7HdMq1VTsuDUoi-jDCCGjP07jFY	2026-03-26 11:25:02.303	2026-03-19 11:25:02.305334
33d5edd7-8c85-4ffd-80ea-44b5c4b22698	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzM5MTk2NTYsImV4cCI6MTc3NDUyNDQ1Nn0.-6wqvWVvBsir05AKZXI5t4WagegPZmVaCMIkVBXWgtg	2026-03-26 11:27:36.228	2026-03-19 11:27:36.229008
5f04ed34-c4f9-47b7-88e1-3980296bbafa	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzM5MzM2NjEsImV4cCI6MTc3NDUzODQ2MX0.30tAaoPBPlBMstyHl8QLp8bQpFVoWEj-Yve7-xcT_3o	2026-03-26 15:21:01.11	2026-03-19 15:21:01.111616
9913315d-5acb-4529-9c0c-5da9b2ab1bf0	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzM5MzQ0NjUsImV4cCI6MTc3NDUzOTI2NX0.F-M-Xmt3E-Q3nGd4P9XYLmruYbELsx256pzcr5x5Cjg	2026-03-26 15:34:25.543	2026-03-19 15:34:25.544681
de728b20-e7bc-4827-80f4-944a3176c011	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQwMDA0OTksImV4cCI6MTc3NDYwNTI5OX0.zL2EWoUkbABB_H3YqjSSozIGVmLxjKiFxsrKldKbDY0	2026-03-27 09:54:59.41	2026-03-20 09:54:59.411829
d2c803f8-063a-4406-a934-0e9471ed1687	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQyNDQ4NDEsImV4cCI6MTc3NDg0OTY0MX0.gj4JRgYqFYStvEJWnVLy6c0aP_ntL6_B0fYs3MwDmqY	2026-03-30 05:47:21.736	2026-03-23 05:47:21.742338
87a8b89f-3a5e-429b-9950-a8e1719de151	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQyODUxNDYsImV4cCI6MTc3NDg4OTk0Nn0.hrGPUopjp1Rnsxnla4nG2YNjqi5BQaR0ZSQrn298_8Q	2026-03-30 16:59:06.957	2026-03-23 16:59:06.958522
a7a1783f-6709-4c65-b472-e638b50e5bb2	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQyODY2MjYsImV4cCI6MTc3NDg5MTQyNn0.1lXw26Qx__iVEzpVK12tMRXklsau-X2YXNjDAvLYyOY	2026-03-30 17:23:46.553	2026-03-23 17:23:46.554282
c9451cb8-b2d9-4d0a-959b-1c33fe0f86b3	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ0NDcyMjYsImV4cCI6MTc3NTA1MjAyNn0.78ebgMwBCFGfFWfNxm24zjnOxqsDokgZNlYKiD2cnxg	2026-04-01 14:00:26.26	2026-03-25 14:00:26.266383
3e109358-2cdc-4150-9dd4-9ff9b8eb5325	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ0NDgyODAsImV4cCI6MTc3NTA1MzA4MH0.y234oAqrbES3btA0swzUbzuFNNwY6dqAW5M91Bn6SEE	2026-04-01 14:18:00.783	2026-03-25 14:18:00.783884
5a44532d-0a3e-4d46-8a20-f946ec5fccc3	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ1MDE0MjksImV4cCI6MTc3NTEwNjIyOX0.LTv3FuQ5tYY0TNVYApglPGzN1oLxin2AmFypJ1xjd2U	2026-04-02 05:03:49.056	2026-03-26 05:03:49.057647
c12758c9-cbe1-4fe3-aea6-d029dce76ffe	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ1MjM4OTUsImV4cCI6MTc3NTEyODY5NX0.jc9Qfkz3WCpqGfXW20_MWb5OvXcSro1aZdA8pkmFheg	2026-04-02 11:18:15.75	2026-03-26 11:18:15.752039
e6adb912-514f-4b86-8f97-2d23b9aea820	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ1MzU5NjMsImV4cCI6MTc3NTE0MDc2M30.ZtwpUxah6B9_7Y1a2eV83J3NwTlPF_zOdHEXDAUBp3s	2026-04-02 14:39:23.829	2026-03-26 14:39:23.83014
dcfad6bf-61c2-4a05-af19-1dda6808a202	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ1NDc1NjIsImV4cCI6MTc3NTE1MjM2Mn0.iYeNX-Uo1E2CjFG8qt_OUqOr-VTEtHvYB2QJRung_PQ	2026-04-02 17:52:42.453	2026-03-26 17:52:42.454244
6c4f39f0-db5c-449c-85a6-e3ed34fc2a4d	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ1ODgxMDcsImV4cCI6MTc3NTE5MjkwN30.odrKAmusC_5bjsjoOfurA1O74FfJyRn6JhTHEuoA9Q0	2026-04-03 05:08:27.056	2026-03-27 05:08:27.058115
f9c9f1e5-f401-4989-b4dc-a98e1779b047	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ3MjEwNjcsImV4cCI6MTc3NTMyNTg2N30.2RKAYxeZZ1n5YRVaoTyoEw8FoyfHFYw0sonkxMm2BOQ	2026-04-04 18:04:27.864	2026-03-28 18:04:27.865862
a3734f54-b62e-4d9a-9903-eff9a1d7dfe8	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ4NDg3NDksImV4cCI6MTc3NTQ1MzU0OX0.oksDeZJYyDil_64xGfWZTN-6Woa7Dn4Ue0XTxTC4A4k	2026-04-06 05:32:29.764	2026-03-30 05:32:29.765947
a449d1d5-f36f-487b-aa0b-53c46f79ea0a	2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWU1Nzk5MS1kYmM5LTQyYmYtODBjOS04MmRkMGFiMGFkOTQiLCJpYXQiOjE3NzQ4NTE2OTksImV4cCI6MTc3NTQ1NjQ5OX0.jG5sjTXYG0_Eo4lG4wy0SPEVJEvF3NIG75EO9pczTVc	2026-04-06 06:21:39.878	2026-03-30 06:21:39.880804
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, "avatarUrl", "firstName", "lastName", phone, email, password, role, status) FROM stdin;
2ae57991-dbc9-42bf-80c9-82dd0ab0ad94	\N	launchpad	admin	+918545613135	launchpadadmin@yopmail.com	$2b$12$wfgUE/I38NcsIhmaK3K/2.sIYIzuzgaC2GBUFkNF48WdPSMJIPCB2	admin	Active
4ac90870-b341-4f52-9616-8f7bfc0a1bf0	\N	Anshuman	Mishra	9876543210	participant1@yopmail.com	$2b$12$4Sz4Ex2cGJ49aDOgOLPMgOEXY0RD63kvJMl8IrFRHU8bHqAn/pMi.	participant	Active
9575cefe-1669-4b08-882a-1fcd670be30f	\N	Kunal	Sharma	+91 93546 78205	kunal@yopmail.com	$2b$12$ZhrhhhKujC2XV6yPUGHoQO2GgxsnReFjNPP4KtW.2iM5aMhzUf70i	participant	Active
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.migrations_id_seq', 2, true);


--
-- Name: participant_profiles PK_578bbbf4d571f7b614aeb78dde1; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participant_profiles
    ADD CONSTRAINT "PK_578bbbf4d571f7b614aeb78dde1" PRIMARY KEY (id);


--
-- Name: refresh_tokens PK_7d8bee0204106019488c4c50ffa; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: otps PK_91fef5ed60605b854a2115d2410; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: admin_profile PK_bc784ca31eb1821ba53980ca23d; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.admin_profile
    ADD CONSTRAINT "PK_bc784ca31eb1821ba53980ca23d" PRIMARY KEY (id);


--
-- Name: form_templates PK_dda93f70be71cb4a2e496b5ae49; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT "PK_dda93f70be71cb4a2e496b5ae49" PRIMARY KEY (id);


--
-- Name: form_submissions PK_fb6e1e9f26cda31c358a8a1530e; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT "PK_fb6e1e9f26cda31c358a8a1530e" PRIMARY KEY (id);


--
-- Name: judge_profile PK_fd106e58aea1a866b031cec535a; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.judge_profile
    ADD CONSTRAINT "PK_fd106e58aea1a866b031cec535a" PRIMARY KEY (id);


--
-- Name: admin_profile REL_1a272d44c2214c1e8b22a886d6; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.admin_profile
    ADD CONSTRAINT "REL_1a272d44c2214c1e8b22a886d6" UNIQUE ("userId");


--
-- Name: judge_profile REL_2b16c12adf8083694847b258a7; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.judge_profile
    ADD CONSTRAINT "REL_2b16c12adf8083694847b258a7" UNIQUE ("userId");


--
-- Name: participant_profiles REL_79bcfabab73c6fbb4a11f69296; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participant_profiles
    ADD CONSTRAINT "REL_79bcfabab73c6fbb4a11f69296" UNIQUE ("userId");


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: IDX_508fb421afa2c6eca3f07a112d; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_508fb421afa2c6eca3f07a112d" ON public.form_submissions USING btree (template_id);


--
-- Name: admin_profile FK_1a272d44c2214c1e8b22a886d61; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.admin_profile
    ADD CONSTRAINT "FK_1a272d44c2214c1e8b22a886d61" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: judge_profile FK_2b16c12adf8083694847b258a72; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.judge_profile
    ADD CONSTRAINT "FK_2b16c12adf8083694847b258a72" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: form_submissions FK_508fb421afa2c6eca3f07a112dc; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT "FK_508fb421afa2c6eca3f07a112dc" FOREIGN KEY (template_id) REFERENCES public.form_templates(id) ON DELETE CASCADE;


--
-- Name: participant_profiles FK_79bcfabab73c6fbb4a11f692964; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participant_profiles
    ADD CONSTRAINT "FK_79bcfabab73c6fbb4a11f692964" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict yqIZp2RJUwNRkVQfmeReUtFqdGx4oIkodpgsMziiiYpEOEzgiUy14C7VMAdc1tt

