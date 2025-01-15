document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("id"); // Get business ID from URL
  
    if (businessId) {
      // Fetch business details based on ID
      fetch(`/businesses/detail/${businessId}`)
        .then((response) => response.json())
        .then((details) => {
          // Populate HTML elements with business data
          document.getElementById("namaUsaha").textContent = details.nama_usaha;
          document.getElementById("jenisUsaha").textContent = details.jenis_usaha;
          document.getElementById("alamat").textContent = details.alamat;
          document.getElementById("noHp").textContent = details.no_hp;
  
          // Handle website link
          let websiteUrl = details.website;
          if (websiteUrl && !websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
            websiteUrl = "http://" + websiteUrl;
          }
          document.getElementById("website").innerHTML = websiteUrl
            ? `<a href="${websiteUrl}" target="_blank" rel="noopener noreferrer">${websiteUrl}</a>`
            : "Tidak ada website tersedia";
  
          // Ensure that the address is valid and properly encoded before embedding in the map
          const alamat = details.alamat.trim();
          if (alamat) {
            const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyCtlFFi--6r8Cq92kVn1dxnfJNkHY4AkrY&q=${encodeURIComponent(alamat)}`;
            document.getElementById("google-map").src = mapUrl;
          } else {
            document.getElementById("google-map").src = ""; // Clear the map if no valid address
            console.error("Alamat tidak ditemukan atau tidak valid.");
          }
  
          // Dynamically set the business image inside the div#fotoUsaha
          const fotoContainer = document.getElementById("fotoUsaha");
          const businessImage = details.foto
            ? `<img src="${details.foto}" alt="${details.nama_usaha}" class="business-image">`
            : `<img src="img/default-business.jpg" alt="Default Image" class="business-image">`;
  
          // Insert the image HTML inside the div
          fotoContainer.innerHTML = businessImage;
        })
        .catch((error) => {
          console.error("Error fetching business details:", error);
          document.querySelector(".details-container").innerHTML =
            "<p>Gagal memuat detail usaha. Silakan coba lagi nanti.</p>";
        });
    } else {
      document.querySelector(".details-container").innerHTML =
        "<p>ID usaha tidak ditemukan di URL.</p>";
    }
  });
  