document.addEventListener("DOMContentLoaded", function () {
  const jenisUsahaSelect = document.getElementById("jenisUsahaSelect");
  const businessesDiv = document.getElementById("businesses");
  const searchInput = document.getElementById("searchBox");
  let currentPage = 1; // Halaman saat ini
  const itemsPerPage = 8; // Ubah menjadi 8 per halaman

  // Ambil kategori usaha
  fetch("/categories")
    .then((response) => response.json())
    .then((categories) => {
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.nama_kategori;
        option.textContent = category.nama_kategori;
        jenisUsahaSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });

  // Tampilkan daftar usaha ketika kategori dipilih
  jenisUsahaSelect.addEventListener("change", function () {
    const categoryName = jenisUsahaSelect.value;
    if (categoryName) {
      fetchBusinesses(categoryName, currentPage);
    } else {
      businessesDiv.innerHTML = "";
      searchBusinesses();  // Panggil pencarian global saat kategori kosong
    }
  });

  // Pencarian usaha berdasarkan input
  searchInput.addEventListener("input", function () {
    const searchQuery = searchInput.value.toLowerCase();
    const categoryName = jenisUsahaSelect.value;
    console.log("Searching for:", searchQuery, "in category:", categoryName); // Debugging log
  
    if (categoryName) {
      // Pencarian dalam kategori yang dipilih
      fetchBusinesses(categoryName, currentPage, searchQuery);
    } else {
      // Pencarian global (tanpa kategori)
      searchBusinesses(searchQuery);
    }
  });

  // Fungsi untuk mencari usaha secara global (tanpa kategori)
  function searchBusinesses(searchQuery = "") {
    if (!searchQuery) {
      businessesDiv.innerHTML = "<p>Silakan masukkan istilah pencarian.</p>";
      // Hilangkan pagination ketika tidak ada hasil pencarian
      document.getElementById('pagination').innerHTML = '';
      return;
    }
  
    console.log("Fetching businesses globally for query:", searchQuery); // Debugging log
  
    fetch(`/businesses/search?query=${searchQuery}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Received businesses data:", data); // Debugging log
        businessesDiv.innerHTML = ""; // Menghapus konten lama
        const businesses = data.businesses;
  
        if (businesses.length > 0) {
          businesses.forEach((business) => {
            const businessCard = document.createElement("div");
            businessCard.classList.add("business-card");
  
            const businessImage = business.foto
              ? `<img src="${business.foto}" alt="${business.nama_usaha}" class="business-image">`
              : `<img src="/path/to/default-image.jpg" alt="Default Image" class="business-image">`;
  
            businessCard.innerHTML = `
              ${businessImage}
              <h3>${business.nama_usaha}</h3>
              <p><strong>Jenis Usaha:</strong> ${business.jenis_usaha}</p>
              <a href="detail.html?id=${business.id}" class="detail-button">Lihat Detail</a>
            `;
  
            businessesDiv.appendChild(businessCard);
          });
        } else {
          businessesDiv.innerHTML = "<p>Tidak ditemukan bisnis yang cocok.</p>";
        }
  
        // Menghilangkan pagination pada pencarian global
        document.getElementById('pagination').innerHTML = '';
      })
      .catch((error) => {
        console.error("Error searching businesses:", error);
      });
  }

  // Ambil usaha berdasarkan kategori dan halaman
  function fetchBusinesses(categoryName, page, searchQuery = "") {
    const url = `/businesses/category/${categoryName}?page=${page}&limit=${itemsPerPage}&query=${searchQuery}`;
    console.log("Fetching businesses for category:", categoryName, "with search query:", searchQuery); // Debugging log
  
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        console.log("Received businesses for category:", data); // Debugging log
        const businesses = data.businesses;
        const totalPages = data.totalPages;
        businessesDiv.innerHTML = ""; // Menghapus konten lama
  
        if (businesses.length > 0) {
          businesses.forEach((business) => {
            const businessCard = document.createElement("div");
            businessCard.classList.add("business-card");
  
            const businessImage = business.foto
            ? `<img src="${business.foto}" alt="${business.nama_usaha}" class="business-image">`
            : `<img src="/path/to/default-image.jpg" alt="Default Image" class="business-image">`;
  
            businessCard.innerHTML = `
            ${businessImage}
            <h3>${business.nama_usaha}</h3>
            <p><strong>Jenis Usaha:</strong> ${business.jenis_usaha}</p>
            <a href="detail.html?id=${business.id}" class="detail-button">Lihat Detail</a>
          `;
  
            businessesDiv.appendChild(businessCard);
          });
          createPagination(currentPage, totalPages);
        } else {
          businessesDiv.innerHTML = "<p>Tidak ditemukan bisnis di kategori ini.</p>";
        }
      })
      .catch((error) => {
        console.error("Error fetching businesses:", error);
      });
  }
  

  // Membuat tombol pagination
  function createPagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById('pagination');
    const existingPagination = paginationContainer.querySelector('.pagination');
    if (existingPagination) {
      existingPagination.remove();
    }

    const paginationDiv = document.createElement("div");
    paginationDiv.classList.add("pagination");

    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement("button");
      pageButton.textContent = i;
      pageButton.classList.add("page");
      pageButton.onclick = function () {
        currentPage = i;
        fetchBusinesses(jenisUsahaSelect.value, currentPage);
      };
      if (i === currentPage) {
        pageButton.style.fontWeight = "bold";
      }
      paginationDiv.appendChild(pageButton);
    }

    paginationContainer.appendChild(paginationDiv);
  }
});
