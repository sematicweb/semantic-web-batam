document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Mencegah reload halaman saat form disubmit

  const username = document.getElementById('username').value; // Ambil nilai input username
  const password = document.getElementById('password').value; // Ambil nilai input password

  try {
      // Kirim permintaan login ke server
      const response = await fetch('/admin/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }), // Data login dikirim dalam format JSON
      });

      const result = await response.json(); // Parse respons dari server

      if (response.ok) {
          // Jika login berhasil
          Swal.fire({
              icon: 'success',
              title: 'Login Berhasil',
              text: 'Selamat datang!',
              confirmButtonText: 'OK',
              customClass: {
                  confirmButton: 'swal-button', // Tambahkan kelas kustom untuk tombol
              },
          }).then(() => {
              window.location.href = 'dashboard.html'; // Redirect ke halaman dashboard
          });
      } else {
          // Jika login gagal
          Swal.fire({
              icon: 'error',
              title: 'Login Gagal',
              text: 'Username atau password salah',
              confirmButtonText: 'Coba Lagi',
              customClass: {
                  confirmButton: 'swal-button', // Tambahkan kelas kustom untuk tombol
              },
          });
      }
  } catch (error) {
      // Jika terjadi kesalahan jaringan atau lainnya
      console.error('Error during login:', error);
      Swal.fire({
          icon: 'error',
          title: 'Terjadi Kesalahan',
          text: 'Silakan coba lagi nanti.',
          customClass: {
              confirmButton: 'swal-button', // Tambahkan kelas kustom untuk tombol
          },
      });
  }
});
