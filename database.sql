CREATE TABLE PENGGUNA (
    username VARCHAR(30) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    foto_profil BYTEA,
    tanggal_lahir DATE,
    alamat VARCHAR(255),
    no_telepon VARCHAR(20),
    no_rekening VARCHAR(100),
    nama_bank VARCHAR(255)
);

CREATE TABLE EVENT (
    id_event VARCHAR(20) PRIMARY KEY,
    judul_event VARCHAR(255) NOT NULL,
    foto_lokasi BYTEA NOT NULL,
    alamat VARCHAR(255) NOT NULL,
    deskripsi TEXT NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    jam_mulai FLOAT NOT NULL,
    jam_selesai FLOAT NOT NULL,
    jumlah_minimum_volunteer INT NOT NULL,
    jumlah_minimum_donasi BIGINT NOT NULL,
    username VARCHAR(30) NOT NULL,
    FOREIGN KEY (username) REFERENCES PENGGUNA(username) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE PENGGUNA_EVENT (
  username VARCHAR(30) NOT NULL,
  id_event VARCHAR(20) NOT NULL,
  PRIMARY KEY (username, id_event),
  FOREIGN KEY (username) REFERENCES PENGGUNA(username) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (id_event) REFERENCES EVENT(id_event) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE DONASI (
    id_donasi VARCHAR(20) PRIMARY KEY,
    tanggal DATE NOT NULL,
    nominal BIGINT NOT NULL,
    username VARCHAR(30) NOT NULL,
    id_event VARCHAR(20) NOT NULL,
    FOREIGN KEY (username) REFERENCES PENGGUNA(username) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_event) REFERENCES EVENT(id_event) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE LAPORAN (
    id_laporan VARCHAR(20) PRIMARY KEY,
    kendala VARCHAR(255),
    jumlah_volunteer INT NOT NULL,
    username VARCHAR(30) NOT NULL,
    FOREIGN KEY (username) REFERENCES PENGGUNA(username) ON UPDATE CASCADE ON DELETE CASCADE
);

