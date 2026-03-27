-- public.accord definition

-- Drop table

-- DROP TABLE public.accord;

CREATE TABLE public.accord (
	accord_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	accord_name varchar(255) NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT accord_pkey PRIMARY KEY (accord_id)
);


-- public."member" definition

-- Drop table

-- DROP TABLE public."member";

CREATE TABLE public."member" (
	member_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	id varchar(45) NOT NULL,
	"password" varchar(200) NOT NULL,
	birth_year int8 NULL,
	gender public."gender_enum" NOT NULL,
	nickname varchar(45) NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT member_id_key UNIQUE (id),
	CONSTRAINT member_pkey PRIMARY KEY (member_id)
);


-- public.note definition

-- Drop table

-- DROP TABLE public.note;

CREATE TABLE public.note (
	note_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	note_name varchar(255) NOT NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT note_pkey PRIMARY KEY (note_id)
);


-- public.perfume definition

-- Drop table

-- DROP TABLE public.perfume;

CREATE TABLE public.perfume (
	perfume_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	image_route varchar(255) NULL,
	perfume_name varchar(255) NULL,
	brand varchar(255) NULL,
	price int4 NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	description varchar(1000) NULL,
	url varchar(1000) NULL,
	CONSTRAINT perfume_pkey PRIMARY KEY (perfume_id)
);


-- public.perfume_embedding definition

-- Drop table

-- DROP TABLE public.perfume_embedding;

CREATE TABLE public.perfume_embedding (
	perfume_id int4 NOT NULL,
	"content" text NULL,
	accords _text NULL,
	main_accord text NULL,
	accord_embedding public.vector NULL,
	top_embedding public.vector NULL,
	middle_embedding public.vector NULL,
	base_embedding public.vector NULL,
	single_embedding public.vector NULL,
	desc_embedding public.vector NULL,
	CONSTRAINT perfume_embedding_pkey PRIMARY KEY (perfume_id)
);


-- public.diary definition

-- Drop table

-- DROP TABLE public.diary;

CREATE TABLE public.diary (
	diary_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	member_id int8 NOT NULL,
	perfume_id int8 NOT NULL,
	title varchar(100) NULL,
	detail text NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT diary_pkey PRIMARY KEY (diary_id),
	CONSTRAINT fk_diary_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id),
	CONSTRAINT fk_diary_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id)
);


-- public.diary_image definition

-- Drop table

-- DROP TABLE public.diary_image;

CREATE TABLE public.diary_image (
	diary_image_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	diary_id int8 NOT NULL,
	image_route varchar(255) NOT NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT diary_image_pkey PRIMARY KEY (diary_image_id),
	CONSTRAINT fk_diary_image_diary FOREIGN KEY (diary_id) REFERENCES public.diary(diary_id)
);


-- public.likes definition

-- Drop table

-- DROP TABLE public.likes;

CREATE TABLE public.likes (
	likes_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	member_id int8 NOT NULL,
	perfume_id int8 NOT NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT likes_member_id_perfume_id_key UNIQUE (member_id, perfume_id),
	CONSTRAINT likes_pkey PRIMARY KEY (likes_id),
	CONSTRAINT fk_likes_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id),
	CONSTRAINT fk_likes_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id)
);


-- public.member_perfume definition

-- Drop table

-- DROP TABLE public.member_perfume;

CREATE TABLE public.member_perfume (
	member_perfume_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	member_id int8 NOT NULL,
	perfume_id int8 NOT NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT member_perfume_member_id_perfume_id_key UNIQUE (member_id, perfume_id),
	CONSTRAINT member_perfume_pkey PRIMARY KEY (member_perfume_id),
	CONSTRAINT fk_member_perfume_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id),
	CONSTRAINT fk_member_perfume_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id)
);


-- public.perfume_accord definition

-- Drop table

-- DROP TABLE public.perfume_accord;

CREATE TABLE public.perfume_accord (
	perfume_accord_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	accord_id int8 NOT NULL,
	perfume_id int8 NOT NULL,
	accord_order int8 NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT perfume_accord_pkey PRIMARY KEY (perfume_accord_id),
	CONSTRAINT fk_perfume_accord_accord FOREIGN KEY (accord_id) REFERENCES public.accord(accord_id),
	CONSTRAINT fk_perfume_accord_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id) ON DELETE CASCADE
);


-- public.perfume_note definition

-- Drop table

-- DROP TABLE public.perfume_note;

CREATE TABLE public.perfume_note (
	perfume_note_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	perfume_id int8 NOT NULL,
	note_id int8 NOT NULL,
	note_level public."note_level_enum" NOT NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT perfume_note_pkey PRIMARY KEY (perfume_note_id),
	CONSTRAINT fk_perfume_note_note FOREIGN KEY (note_id) REFERENCES public.note(note_id),
	CONSTRAINT fk_perfume_note_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id) ON DELETE CASCADE
);


-- public.recommend_result definition

-- Drop table

-- DROP TABLE public.recommend_result;

CREATE TABLE public.recommend_result (
	recommend_result_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	member_id int8 NOT NULL,
	keyword varchar(255) NULL,
	image_route varchar(255) NULL,
	create_time timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT recommend_result_pkey PRIMARY KEY (recommend_result_id),
	CONSTRAINT fk_recommend_result_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id)
);


-- public.review definition

-- Drop table

-- DROP TABLE public.review;

CREATE TABLE public.review (
	review_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	detail text NULL,
	member_id int8 NOT NULL,
	perfume_id int8 NOT NULL,
	rating int2 NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT review_pkey PRIMARY KEY (review_id),
	CONSTRAINT fk_review_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id),
	CONSTRAINT fk_review_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id)
);


-- public.try_diary definition

-- Drop table

-- DROP TABLE public.try_diary;

CREATE TABLE public.try_diary (
	try_diary_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	member_id int8 NOT NULL,
	title varchar(100) NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT try_diary_pkey PRIMARY KEY (try_diary_id),
	CONSTRAINT fk_try_diary_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id)
);


-- public.try_diary_perfume definition

-- Drop table

-- DROP TABLE public.try_diary_perfume;

CREATE TABLE public.try_diary_perfume (
	try_diary_perfume_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	perfume_id int8 NOT NULL,
	try_diary_id int8 NOT NULL,
	description text NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	place varchar(255) NULL,
	lasting int4 NULL,
	sillage public."sillage_type" NULL,
	season public."season_type" NULL,
	CONSTRAINT try_diary_perfume_pkey PRIMARY KEY (try_diary_perfume_id),
	CONSTRAINT fk_try_diary_perfume_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id),
	CONSTRAINT fk_try_diary_perfume_try_diary FOREIGN KEY (try_diary_id) REFERENCES public.try_diary(try_diary_id)
);


-- public.perfume_recommend definition

-- Drop table

-- DROP TABLE public.perfume_recommend;

CREATE TABLE public.perfume_recommend (
	perfume_recommend_id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	recommend_result_id int8 NOT NULL,
	perfume_id int8 NOT NULL,
	reasons text NULL,
	create_time timestamp NULL,
	modify_time timestamp NULL,
	delete_time timestamp NULL,
	is_delete bool DEFAULT false NULL,
	CONSTRAINT perfume_recommend_pkey PRIMARY KEY (perfume_recommend_id),
	CONSTRAINT fk_perfume_recommend_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id),
	CONSTRAINT fk_perfume_recommend_result FOREIGN KEY (recommend_result_id) REFERENCES public.recommend_result(recommend_result_id)
);