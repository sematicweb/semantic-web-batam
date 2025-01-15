// Fungsi untuk memeriksa apakah user sudah login
async function checkLogin() {
    try {
        const response = await fetch('/admin/isLoggedIn');
        const result = await response.json();

        if (!result.isLoggedIn) {
            window.location.href = 'login.html';
        } else {
            await Promise.all([loadOverview(), loadCategories(), loadBusinesses()]);
        }
    } catch (error) {
        console.error('Kesalahan saat memeriksa login:', error);
        window.location.href = 'login.html';
    }
}

// Fungsi untuk memuat jumlah bisnis dan kategori
async function loadOverview() {
    try {
        const response = await fetch('/dashboard');
        const data = await response.json();

        document.getElementById('businessCount').textContent = data.businessCount;
        document.getElementById('categoryCount').textContent = data.categoryCount;
    } catch (error) {
        console.error('Kesalahan saat memuat data overview:', error);
    }
}

// Fungsi untuk memuat kategori dari server
async function loadCategories() {
    try {
        const response = await fetch('/categories');
        if (!response.ok) throw new Error('Gagal memuat kategori.');

        const categories = await response.json();

        // Memperbarui tabel kategori
        const categoryTable = document.getElementById('categoryTable').getElementsByTagName('tbody')[0];
        categoryTable.innerHTML = '';

        categories.forEach(category => {
            const row = categoryTable.insertRow();
            row.insertCell(0).textContent = category.nama_kategori;

            // Menambahkan tombol Edit dan Hapus
            const actionCell = row.insertCell(1);
            actionCell.innerHTML = `
                <button class="editCategoryBtn" data-id="${category.id}">Edit</button>
                <button class="deleteCategoryBtn" data-id="${category.id}">Hapus</button>
            `;
        });

        // Memperbarui dropdown categorySelect dan editCategorySelect
        updateCategoryDropdowns(categories);

        // Menambahkan event listener untuk tombol edit dan hapus
        addCategoryEventListeners();
    } catch (error) {
        console.error('Kesalahan saat memuat kategori:', error);
        displayAlert('Error!', 'Gagal memuat kategori.', 'error');
    }
}


// Fungsi untuk memperbarui dropdown kategori
function updateCategoryDropdowns(categories) {
    const categorySelect = document.getElementById('categorySelect');
    const editCategorySelect = document.getElementById('editCategorySelect');

    // Mengosongkan dropdown
    categorySelect.innerHTML = '<option value="">Pilih Kategori</option>';
    editCategorySelect.innerHTML = '<option value="">Pilih Kategori</option>';

    // Menambahkan kategori ke dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.nama_kategori;

        // Menambahkan ke kedua dropdown
        categorySelect.appendChild(option.cloneNode(true));
        editCategorySelect.appendChild(option);
    });
}

async function fetchCategories() {
    try {
        const response = await fetch('/categories');  // Ganti dengan endpoint yang sesuai
        if (!response.ok) throw new Error('Gagal mengambil data kategori.');
        const categories = await response.json();
        updateCategoryDropdowns(categories);  // Isi dropdown dengan kategori
    } catch (error) {
        console.error('Error:', error);
    }
}


// Fungsi untuk menambahkan event listener pada kategori
function addCategoryEventListeners() {
    document.querySelectorAll('.editCategoryBtn').forEach(button => {
        button.addEventListener('click', editCategory);
    });
    document.querySelectorAll('.deleteCategoryBtn').forEach(button => {
        button.addEventListener('click', deleteCategory);
    });
}
// Fungsi untuk memuat bisnis dengan pagination
async function loadBusinesses(page = 1) {
    try {
        const response = await fetch(`/businesses?page=${page}`);
        const data = await response.json();

        const businessTable = document.getElementById('businessTable').getElementsByTagName('tbody')[0];
        businessTable.innerHTML = '';
        data.businesses.forEach(business => {
            const row = businessTable.insertRow();
            row.insertCell(0).textContent = business.nama_usaha;
            row.insertCell(1).textContent = business.jenis_usaha;
            row.insertCell(2).textContent = business.alamat;
            row.insertCell(3).textContent = business.no_hp;
            row.insertCell(4).textContent = business.website;
            row.insertCell(5).textContent = business.category_name;
            
            const actionCell = row.insertCell(6);
            actionCell.innerHTML = `
                <button class="editBtn" data-id="${business.id}">Edit</button>
                <button class="deleteBtn" data-id="${business.id}">Hapus</button>
            `;
        });

        addBusinessEventListeners();
        updatePagination(data.totalPages);
    } catch (error) {
        console.error('Kesalahan saat memuat bisnis:', error);
    }
}

// Fungsi untuk menambahkan event listener pada bisnis
function addBusinessEventListeners() {
    document.querySelectorAll('.editBtn').forEach(button => {
        button.addEventListener('click', editBusiness);
    });
    document.querySelectorAll('.deleteBtn').forEach(button => {
        button.addEventListener('click', deleteBusiness);
    });
}

// Fungsi untuk memperbarui tombol pagination
function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.onclick = () => loadBusinesses(i);
        pagination.appendChild(button);
    }
}

// Fungsi untuk menambahkan kategori
document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const categoryName = document.getElementById('categoryName').value.trim();
    if (!categoryName) {
        displayAlert('Error!', 'Nama kategori tidak boleh kosong!', 'error');
        return;
    }

    try {
        const response = await fetch('/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama_kategori: categoryName }),
        });

        if (response.ok) {
            displayAlert('Sukses!', 'Kategori berhasil ditambahkan.', 'success');
            document.getElementById('categoryName').value = '';
            loadCategories();
        } else {
            displayAlert('Error!', 'Kategori sudah ada. Silakan coba lagi.', 'error');
        }
    } catch (error) {
        console.error('Kesalahan saat menambahkan kategori:', error);
    }
});

// Fungsi untuk menambahkan bisnis
document.getElementById('addBusinessForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const businessName = document.getElementById('businessName').value.trim();
    const categoryName = document.getElementById('categorySelect').selectedOptions[0].text.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const website = document.getElementById('website').value.trim();
    const businessPhoto = document.getElementById('businessPhoto').files[0]; // Ambil file foto

    if (!businessName || !categoryName || !address || !phone) {
        Swal.fire({
            title: 'Error!',
            text: 'Harap isi semua field yang wajib!',
            icon: 'error',
            confirmButtonText: 'OK',
        });
        return;
    }

    // Membuat FormData untuk mengirimkan data termasuk file gambar
    const formData = new FormData();
    formData.append('nama_usaha', businessName);
    formData.append('jenis_usaha', categoryName);
    formData.append('alamat', address);
    formData.append('no_hp', phone);
    formData.append('website', website);
    formData.append('category_name', categoryName);
    formData.append('businessPhoto', businessPhoto);

    try {
        const response = await fetch('/businesses', {
            method: 'POST',
            body: formData, // Mengirimkan FormData yang berisi file
        });

        if (response.ok) {
            Swal.fire({
                title: 'Sukses!',
                text: 'Bisnis berhasil ditambahkan.',
                icon: 'success',
                confirmButtonText: 'OK',
            });

            // Mengosongkan form
            document.getElementById('addBusinessForm').reset();

            // Memuat ulang daftar bisnis
            loadBusinesses();
        } else {
            const errorMessage = await response.text();
            Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    } catch (error) {
        console.error('Kesalahan saat menambahkan bisnis:', error);
    }
});


// Fungsi untuk mengedit bisnis
async function editBusiness(event) {
    const businessId = event.target.getAttribute('data-id'); // Ambil ID bisnis dari atribut data-id tombol

    try {
        const response = await fetch(`/businesses/detail/${businessId}`);
        if (!response.ok) throw new Error('Bisnis tidak ditemukan.');

        const business = await response.json();
        fillEditBusinessForm(business);  // Isi form dengan data bisnis
        document.getElementById('editBusinessSection').style.display = 'block';  // Tampilkan form edit

        // Scroll ke bagian atas halaman terlebih dahulu
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Tunggu hingga DOM siap, lalu fokus pada input
        setTimeout(() => {
            const updateBusinessName = document.getElementById('editBusinessName');
            if (updateBusinessName) {
                updateBusinessName.scrollIntoView({ behavior: 'smooth', block: 'start' });
                updateBusinessName.focus();
            }
        }, 0); // Penundaan 100ms untuk memastikan elemen tersedia

        // Fungsi untuk update bisnis saat tombol update diklik
        document.getElementById('editBusinessForm').onsubmit = async (e) => {
            e.preventDefault();
            await updateBusiness(businessId);  // Panggil fungsi untuk memperbarui bisnis
        };
    } catch (error) {
        console.error('Kesalahan saat mengambil data bisnis:', error);
        displayAlert('Error!', error.message, 'error');
    }
}



// Fungsi untuk mengisi form edit bisnis
function fillEditBusinessForm(business) {
    document.getElementById('editBusinessName').value = business.nama_usaha;
    document.getElementById('editCategorySelect').value = business.category_name;
    document.getElementById('editAddress').value = business.alamat;
    document.getElementById('editPhone').value = business.no_hp;
    document.getElementById('editWebsite').value = business.website;
   
}

// Fungsi untuk memperbarui bisnis
async function updateBusiness(businessId) {
    const updatedBusiness = {
        nama_usaha: document.getElementById('editBusinessName').value,
        category_name: document.getElementById('editCategorySelect').options[document.getElementById('editCategorySelect').selectedIndex].text, // Ambil nama kategori
        alamat: document.getElementById('editAddress').value,
        no_hp: document.getElementById('editPhone').value,
        website: document.getElementById('editWebsite').value,
    };

    // Gunakan FormData untuk mengirimkan file dan data lainnya
    const formData = new FormData();

    // Tambahkan data lainnya ke FormData
    for (const key in updatedBusiness) {
        formData.append(key, updatedBusiness[key]);
    }

    // Tambahkan file foto jika ada
    const photoFile = document.getElementById('editBusinessPhoto').files[0];
    if (photoFile) {
        formData.append('foto', photoFile);
    }

    try {
        const updateResponse = await fetch(`/businesses/${businessId}`, {
            method: 'PUT',
            body: formData, // Kirimkan FormData, bukan JSON
        });

        if (updateResponse.ok) {
            displayAlert('Sukses!', 'Bisnis berhasil diperbarui.', 'success');
            loadBusinesses(); // Refresh data bisnis
            hideEditBusinessForm();
        } else {
            const responseData = await updateResponse.json();
            displayAlert('Error!', responseData.error || 'Terjadi kesalahan saat memperbarui bisnis.', 'error');
        }
    } catch (error) {
        console.error('Kesalahan saat memperbarui bisnis:', error);
        displayAlert('Error!', 'Kesalahan sistem saat memperbarui bisnis.', 'error');
    }
}


// Fungsi untuk menyembunyikan form edit bisnis
function hideEditBusinessForm() {
    document.getElementById('editBusinessSection').style.display = 'none';
}

function hideUpdateCategoryForm() {
    document.getElementById('updateCategorySection').style.display = 'none';
}


async function editCategory(event) {
    console.log(event.target); // Periksa elemen yang dipicu oleh event

    const categoryId = event.target.getAttribute('data-id');
    if (!categoryId) {
        console.error('Data ID tidak ditemukan pada tombol');
        return;
    }

    try {
        const response = await fetch(`/categories/detail/${categoryId}`);
        if (!response.ok) throw new Error('Kategori tidak ditemukan.');

        const category = await response.json();
        fillEditCategoryForm(category);

        // Menampilkan form edit kategori
        const updateCategorySection = document.getElementById('updateCategorySection');
        updateCategorySection.style.display = 'block';

        // Scroll ke bagian atas halaman terlebih dahulu
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Scroll ke form edit kategori setelah scroll ke atas
        updateCategorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Fokus pada input nama kategori
        const updateCategoryName = document.getElementById('updateCategoryName');
        updateCategoryName.focus();

        // Fungsi update kategori saat tombol update diklik
        document.getElementById('updateCategoryForm').onsubmit = async (e) => {
            e.preventDefault();
            await updateCategory(categoryId);
        };
    } catch (error) {
        console.error('Kesalahan saat mengambil data kategori:', error);
        displayAlert('Error!', error.message, 'error');
    }
}

function fillEditCategoryForm(category) {
    document.getElementById('updateCategoryName').value = category.nama_kategori;
}


// Fungsi untuk mengirimkan update kategori ke server
async function updateCategory(categoryId) {
    const namaKategori = document.getElementById('updateCategoryName').value.trim();

    // Validasi input
    if (!namaKategori) {
        displayAlert('Error!', 'Nama kategori tidak boleh kosong.', 'error');
        return;
    }

    const updatedCategory = { nama_kategori: namaKategori };

    try {
        const updateResponse = await fetch(`/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedCategory),
        });

        if (updateResponse.ok) {
            displayAlert('Sukses!', 'Kategori berhasil diperbarui.', 'success');
            loadCategories(); // Fungsi untuk memuat ulang kategori
            hideUpdateCategoryForm(); // Fungsi untuk menutup form
        } else {
            const responseData = await updateResponse.json();
            displayAlert('Error!', responseData.error || 'Terjadi kesalahan saat memperbarui kategori.', 'error');
        }
    } catch (error) {
        console.error('Kesalahan saat memperbarui kategori:', error);
        displayAlert('Error!', 'Kesalahan sistem saat memperbarui kategori.', 'error');
    }
}


// Fungsi untuk menghapus bisnis
async function deleteBusiness(event) {
    const businessId = event.target.getAttribute('data-id');

    const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: 'Bisnis ini akan dihapus.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
        try {
            const deleteResponse = await fetch(`/businesses/${businessId}`, {
                method: 'DELETE',
            });

            if (deleteResponse.ok) {
                displayAlert('Sukses!', 'Bisnis berhasil dihapus.', 'success');
                loadBusinesses();  // Memuat ulang daftar bisnis
            } else {
                displayAlert('Error!', 'Terjadi kesalahan saat menghapus bisnis.', 'error');
            }
        } catch (error) {
            console.error('Kesalahan saat menghapus bisnis:', error);
        }
    }
}

// Fungsi untuk menghapus kategori
async function deleteCategory(event) {
    const categoryId = event.target.getAttribute('data-id');

    const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: 'Kategori ini akan dihapus.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
        try {
            const deleteResponse = await fetch(`/categories/${categoryId}`, {
                method: 'DELETE', // Menggunakan DELETE untuk menghapus kategori
            });

            if (deleteResponse.ok) {
                displayAlert('Sukses!', 'Kategori berhasil dihapus.', 'success');
                loadCategories(); // Fungsi untuk memuat ulang kategori
            } else {
                displayAlert('Error!', 'Kategori tidak bisa di hapus, Di karenakan categori tersebut masih ada yang pakek di bisnis', 'error');
            }
        } catch (error) {
            console.error('Kesalahan saat menghapus kategori:', error);
        }
    }
}

// Fungsi untuk logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: 'Anda akan keluar dari dashboard.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Keluar!',
        cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch('/admin/logout', { method: 'POST' });
            if (response.ok) {
                localStorage.removeItem('userSession');
                sessionStorage.clear();
                window.location.href = '/index.html';
            } else {
                displayAlert('Error!', 'Terjadi kesalahan saat logout.', 'error');
            }
        } catch (error) {
            console.error('Kesalahan saat logout:', error);
        }
    }
});

// Panggil fungsi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
});

// Fungsi untuk menampilkan alert
function displayAlert(title, text, icon) {
    Swal.fire({
        title,
        text,
        icon,
        confirmButtonText: 'OK',
    });
}