// Import module yang diperlukan
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/admin', express.static('admin'));
app.use('/uploads', express.static('uploads'));
app.use(session({
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: true,
}));

// Konfigurasi koneksi ke database
const dbConfig = {
    host: 'bq8dmynnlpxzyd2x2mcr-mysql.services.clever-cloud.com',
    user: 'ujskzwxrxov3nqln',
    password: '2N87KBtfPGtMOljVx7wH',
    database: 'bq8dmynnlpxzyd2x2mcr', 
};

// Fungsi untuk membuat koneksi
function createConnection() {
    const connection = mysql.createConnection(dbConfig);

    // Menangani error koneksi
    connection.connect(err => {
        if (err) {
            console.error('Kesalahan koneksi database:', err);
            setTimeout(createConnection, 5000); // Coba lagi setelah 5 detik
        } else {
            console.log('Terhubung ke database');
        }
    });

    // Menangani error jika koneksi terputus
    connection.on('error', (err) => {
        console.error('Kesalahan database:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            createConnection(); // Jika koneksi hilang, coba sambungkan ulang
        } else {
            throw err; // Error lainnya, lemparkan untuk ditangani
        }
    });

    return connection;
}

// Membuat koneksi pertama kali
let db = createConnection();

// Mengecek koneksi setiap 1 menit dan mencoba reconnect jika diperlukan
setInterval(() => {
    if (!db._socket || db._socket._destroyed) {
        console.log('Mencoba menyambungkan ulang ke database...');
        db = createConnection();
    }
}, 60000); // Mengecek koneksi setiap 1 menit

// Rute dan handler lainnya
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Fungsi: API untuk login admin
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM admins WHERE username = ?';

    db.query(query, [username], (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        if (results.length > 0) {
            const storedPassword = results[0].password;
            if (password === storedPassword) {
                req.session.isAdmin = true;
                res.status(200).json({ message: 'Login berhasil' });
            } else {
                res.status(401).json({ message: 'Username atau password salah' });
            }
        } else {
            res.status(401).json({ message: 'Username atau password salah' });
        }
    });
});

// Fungsi: API untuk cek status login admin
app.get('/admin/isLoggedIn', (req, res) => {
    res.status(req.session.isAdmin ? 200 : 401).json({ isLoggedIn: req.session.isAdmin });
});

// Fungsi: API untuk logout admin
app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.status(200).json({ message: 'Logout berhasil' });
});

// Tentukan konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Fungsi: Menambahkan kategori
app.post('/categories', (req, res) => {
    const { nama_kategori } = req.body;
    if (!nama_kategori) {
        return res.status(400).send('Nama kategori tidak boleh kosong');
    }
    const query = 'INSERT INTO categories (nama_kategori) VALUES (?)';
    db.query(query, [nama_kategori], (err) => {
        if (err) {
            console.error('Error adding category:', err);
            return res.status(500).send('Terjadi kesalahan saat menambahkan kategori');
        }
        res.status(200).json({ message: 'Kategori berhasil ditambahkan' });
    });
});

// Fungsi: Mengambil kategori
app.get('/categories', (req, res) => {
    const query = 'SELECT id, nama_kategori FROM categories';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Terjadi kesalahan saat memuat kategori');
        }
        res.json(results);
    });
});

app.get('/categories', (req, res) => {
    const query = 'SELECT * FROM categories';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil kategori' });
        }
        res.status(200).json(results);
    });
});

// Route untuk mendapatkan kategori berdasarkan ID
app.get('/categories/detail/:id', (req, res) => {
    const categoryId = req.params.id;
    const query = 'SELECT * FROM categories WHERE id = ?';

    db.query(query, [categoryId], (err, results) => {
        if (err) {
            console.error('Error fetching category:', err);
            return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil kategori' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
        }

        res.status(200).json(results[0]); // Mengembalikan data kategori
    });
});

// Route untuk memperbarui kategori
app.put('/categories/:id', (req, res) => {
    const { id } = req.params;
    const { nama_kategori } = req.body;

    // Validasi input
    if (!nama_kategori || nama_kategori.trim() === '') {
        return res.status(400).json({ error: 'Nama kategori harus diisi.' });
    }

    // Query untuk memperbarui kategori
    const query = 'UPDATE categories SET nama_kategori = ? WHERE id = ?';
    db.query(query, [nama_kategori.trim(), id], (err, result) => {
        if (err) {
            console.error('Kesalahan saat memperbarui kategori:', err);
            return res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui kategori.' });
        }

        // Jika tidak ada baris yang diperbarui
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
        }

        // Berhasil memperbarui kategori
        res.json({ message: 'Kategori berhasil diperbarui.' });
    });
});

// Endpoint untuk menghapus kategori
app.delete('/categories/:id', (req, res) => {
    const { id } = req.params;

    // Query untuk menghapus kategori
    const deleteQuery = 'DELETE FROM categories WHERE id = ?';
    db.query(deleteQuery, [id], (err, result) => {
        if (err) {
            console.error('Kesalahan saat menghapus kategori:', err);
            return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus kategori.' });
        }

        // Jika tidak ada baris yang dihapus
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
        }

        // Berhasil menghapus kategori
        res.json({ message: 'Kategori berhasil dihapus.' });
    });
});


app.get("/businesses/category/:categoryName", (req, res) => {
    const categoryName = req.params.categoryName;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.query || "";
  
    // Query SQL untuk mengambil data bisnis berdasarkan kategori dan kata kunci pencarian
    const query = `
      SELECT * FROM businesses
      WHERE category_name = ?
      AND (nama_usaha LIKE ? OR category_name LIKE ?)
      LIMIT ? OFFSET ?
    `;
    db.query(query, [categoryName, `%${searchQuery}%`, `%${searchQuery}%`, limit, offset], (err, results) => {
      if (err) {
        return res.status(500).send("Terjadi kesalahan saat mengambil data bisnis");
      }
      
      // Query untuk menghitung total bisnis
      const countQuery = `
        SELECT COUNT(*) AS total FROM businesses
        WHERE category_name = ? AND (nama_usaha LIKE ? OR category_name LIKE ?)
      `;
      db.query(countQuery, [categoryName, `%${searchQuery}%`, `%${searchQuery}%`], (err, countResult) => {
        if (err) {
          return res.status(500).send("Terjadi kesalahan saat menghitung total bisnis");
        }
  
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
  
        // Menambahkan path gambar relatif
        const businessesWithImages = results.map((business) => {
          return {
            ...business,
            foto: business.foto
              ? `/uploads/${business.foto}`  // Path relatif untuk gambar
              : `/img/default-business.jpg`  // Path relatif untuk gambar default
          };
        });
  
        res.json({
          businesses: businessesWithImages,
          totalPages: totalPages,
          currentPage: page,
        });
      });
    });
  });

// Route untuk menambahkan bisnis
app.post('/businesses', upload.single('businessPhoto'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Tidak ada file yang diunggah');
    }

    const { nama_usaha, jenis_usaha, alamat, no_hp, website, category_name } = req.body;
    const businessPhoto = req.file.filename;

    const checkCategoryQuery = 'SELECT * FROM categories WHERE LOWER(nama_kategori) = LOWER(?)';
    db.query(checkCategoryQuery, [category_name], (err, results) => {
        if (err) {
            return res.status(500).send('Terjadi kesalahan pada database');
        }
        if (results.length === 0) {
            return res.status(400).send('Kategori tidak ditemukan');
        }
        const insertQuery = 'INSERT INTO businesses (nama_usaha, jenis_usaha, alamat, no_hp, website, category_name, foto) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(insertQuery, [nama_usaha, jenis_usaha, alamat, no_hp, website, category_name, businessPhoto], (err) => {
            if (err) {
                return res.status(500).send('Terjadi kesalahan saat menambahkan bisnis');
            }
            res.status(201).send('Bisnis berhasil ditambahkan');
        });
    });
});

// Fungsi: Mengambil semua bisnis dengan paginasi
app.get('/businesses', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const query = 'SELECT * FROM businesses LIMIT ? OFFSET ?';
    db.query(query, [limit, offset], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        const countQuery = 'SELECT COUNT(*) AS total FROM businesses';
        db.query(countQuery, (err, countResult) => {
            if (err) {
                return res.status(500).send(err);
            }
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);
            res.json({
                businesses: results,
                totalPages: totalPages,
                currentPage: page,
            });
        });
    });
});

// Fungsi: Mengambil detail bisnis berdasarkan ID
app.get('/businesses/detail/:id', (req, res) => {
    const businessId = req.params.id;
    db.query('SELECT * FROM businesses WHERE id = ?', [businessId], (err, results) => {
        if (err) {
            console.error('Error fetching business details:', err);
            return res.status(500).send('Error fetching business details.');
        }
        if (results.length === 0) {
            return res.status(404).send('Business not found.');
        }

        const business = results[0];
        const businessImage = business.foto ? `/uploads/${business.foto}` : `/img/default-business.jpg`;

        res.json({
            ...business,
            foto: businessImage,
        });
    });
});

// Fungsi: Mengupdate bisnis berdasarkan ID
app.put('/businesses/:id', upload.single('foto'), (req, res) => {
    const businessId = req.params.id;
    const { nama_usaha, category_name, alamat, no_hp, website } = req.body;
    const foto = req.file ? req.file.filename : null; // Mendapatkan nama file foto jika ada

    // Debugging: Cek data yang diterima
    console.log("Received data:", { nama_usaha, category_name, alamat, no_hp, website, foto });

    // Ambil nama foto lama dari database
    const query = `SELECT foto FROM businesses WHERE id = ?`;
    db.query(query, [businessId], (err, result) => {
        if (err) {
            console.error('Kesalahan saat mengambil data bisnis:', err);
            return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data bisnis.' });
        }

        const oldPhoto = result[0]?.foto;
        if (foto && oldPhoto) {
            // Path foto lama yang ada di folder public/uploads
            const oldPhotoPath = path.join(__dirname, 'public', 'uploads', oldPhoto);

            // Cek apakah file lama ada sebelum mencoba menghapusnya
            fs.access(oldPhotoPath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error('File foto lama tidak ditemukan:', oldPhotoPath);
                } else {
                    // Hapus foto lama jika ada
                    fs.unlink(oldPhotoPath, (err) => {
                        if (err) {
                            console.error('Kesalahan saat menghapus foto lama:', err);
                        } else {
                            console.log('Foto lama berhasil dihapus');
                        }
                    });
                }
            });
        }

        // Update data bisnis dengan foto baru atau foto lama
        const updateQuery = `
            UPDATE businesses 
            SET 
                nama_usaha = ?, 
                category_name = ?, 
                jenis_usaha = ?, 
                alamat = ?, 
                no_hp = ?, 
                website = ?, 
                foto = COALESCE(?, foto) 
            WHERE id = ?
        `;

        // Logika tambahan: Gunakan category_name sebagai jenis_usaha (atau sesuai logika Anda)
        const jenis_usaha = category_name; // Ubah sesuai logika kebutuhan Anda

        db.query(updateQuery, [nama_usaha, category_name, jenis_usaha, alamat, no_hp, website, foto, businessId], (err, result) => {
            if (err) {
                console.error('Kesalahan saat memperbarui bisnis:', err);
                return res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui bisnis.' });
            }

            res.json({ message: 'Bisnis berhasil diperbarui.' });
        });
    });
});

// Endpoint untuk menghapus foto dan bisnis berdasarkan ID
app.delete('/businesses/:id', (req, res) => {
    const businessId = req.params.id;

    // Ambil nama foto dari database
    const query = `SELECT foto FROM businesses WHERE id = ?`;
    db.query(query, [businessId], (err, result) => {
        if (err) {
            console.error('Kesalahan saat mengambil data bisnis:', err);
            return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data bisnis.' });
        }

        const oldPhoto = result[0]?.foto;

        // Hapus foto lama jika ada
        if (oldPhoto) {
            const oldPhotoPath = path.join(__dirname, 'public', 'uploads', oldPhoto);

            // Cek apakah file lama ada sebelum mencoba menghapusnya
            fs.access(oldPhotoPath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error('File foto lama tidak ditemukan:', oldPhotoPath);
                } else {
                    // Hapus foto lama
                    fs.unlink(oldPhotoPath, (err) => {
                        if (err) {
                            console.error('Kesalahan saat menghapus foto lama:', err);
                        } else {
                            console.log('Foto lama berhasil dihapus');
                        }
                    });
                }
            });
        }

        // Hapus data bisnis dari database
        const deleteQuery = `DELETE FROM businesses WHERE id = ?`;
        db.query(deleteQuery, [businessId], (err, result) => {
            if (err) {
                console.error('Kesalahan saat menghapus bisnis:', err);
                return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus bisnis.' });
            }

            res.json({ message: 'Bisnis berhasil dihapus.' });
        });
    });
});

// Fungsi: Mencari bisnis berdasarkan kata kunci
app.get('/businesses/search', (req, res) => {
    const searchQuery = req.query.query || "";

    const query = `
        SELECT * FROM businesses
        WHERE nama_usaha LIKE ? OR jenis_usaha LIKE ?
    `;
    db.query(query, [`%${searchQuery}%`, `%${searchQuery}%`], (err, results) => {
        if (err) {
            return res.status(500).send('Terjadi kesalahan saat mencari bisnis');
        }

        const businessesWithImages = results.map((business) => {
            return {
                ...business,
                foto: business.foto ? `/uploads/${business.foto}` : `/img/default-business.jpg`,
            };
        });

        res.json({
            businesses: businessesWithImages,
        });
    });
});


// Fungsi: Mengambil jumlah bisnis dan kategori
app.get('/dashboard', (req, res) => {
    const businessCountQuery = 'SELECT COUNT(*) AS count FROM businesses';
    db.query(businessCountQuery, (err, businessResults) => {
        if (err) {
            console.error('Error fetching business count:', err);
            res.status(500).send(err);
            return;
        }
        const categoryCountQuery = 'SELECT COUNT(*) AS count FROM categories';
        db.query(categoryCountQuery, (err, categoryResults) => {
            if (err) {
                console.error('Error fetching category count:', err);
                res.status(500).send(err);
                return;
            }
            res.json({
                businessCount: businessResults[0].count,
                categoryCount: categoryResults[0].count,
            });
        });
    });
});

// Fungsi: Menjalankan server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});