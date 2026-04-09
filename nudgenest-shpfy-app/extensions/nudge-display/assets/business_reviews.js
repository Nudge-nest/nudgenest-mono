(function() {
  'use strict';

  const container = document.querySelector('.business-reviews-container');
  if (!container) return;

  const _reviewsHeader = document.getElementById('businessReviewsHeader');
  const loadingEl = document.getElementById('reviewsLoading');
  const gridEl = document.getElementById('reviewsGrid');
  const errorEl = document.getElementById('reviewsError');


  // Get configuration from data attributes
  const reviewsLimit = container.dataset.reviewsLimit || 10;
  const merchantId = container.dataset.merchantId;

  const API_BASE_URL = container.dataset.apiBaseUrl;

  async function loadReviews() {
    console.log('Container dataset',container.dataset);
    try {
      showLoading();
      // Construct API URL with parameters
      const apiUrl = `${API_BASE_URL}reviews/list?shopid=${encodeURIComponent(merchantId)}&limit=${reviewsLimit}&status=approved`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('DATA****', data)

      if (data && Array.isArray(data.data) && data.data.length > 0) {
        renderReviews(data.data);
      } else {
        showNoReviews();
      }

    } catch (error) {
      console.error('Error loading reviews:', error);
      showError();
    }
  }

  function renderReviews(reviews) {
    hideLoading();
    console.log("Summary- reviews1");
    generateHeader();
    const reviewsHTML = reviews.map(review => renderSingleReview(review)).join('');
    gridEl.innerHTML = reviewsHTML;
    gridEl.style.display = 'grid';
  }

  function renderSingleReview(review) {
    // Extract review data according to your schema
    const reviewId = review.id || '';
    const createdAt = review.createdAt || '';
    const result = review.result || [];
    const _items = review.items || [];
    // Review result data
    const numericalResults = result.filter((res)=>res.value);
    const nonNumericalResults = result.filter((res)=>!res.value);
    const numericResultAggregate = numericalResults.reduce((accumulator, currentValue) => accumulator + currentValue.value, 0);
    console.log("Nono´Numerical results array", nonNumericalResults);
    const rating =  numericResultAggregate/numericalResults.length || 5;
    const comment = nonNumericalResults[nonNumericalResults.length - 1].comment || '';
    const media = nonNumericalResults.filter((res)=>res.mediaURL);

    // For now, we'll use a placeholder for customer info
    // You might want to add customer data to your schema
    const customerName = 'Verified Customer';
    const _customerImage = '';

    // Format date
    const reviewDate = createdAt ? new Date(createdAt).toLocaleDateString() : '';

    // Create the review card element
    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-item';
    reviewCard.setAttribute('data-review-id', reviewId);

    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'review-item__rating';
    ratingDiv.innerHTML = generateStarsHTML(rating);

    const dateDiv = document.createElement('div');
    dateDiv.className = 'review-item__date';
    dateDiv.textContent = reviewDate;

    // Build content
    const content = document.createElement('div');
    content.className = 'review-item__content';

    if (media.length > 0) {
      const mediaDiv = generateMediaElements(media);
      content.appendChild(mediaDiv);
    }

    // Build footer
    const footer = document.createElement('div');
    footer.className = 'review-item__footer';

    const customerDiv = document.createElement('div');
    customerDiv.className = 'review-item__customer';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'review-item__customer-name';
    nameSpan.textContent = customerName;

    /*customerDiv.appendChild(avatarDiv);*/
    customerDiv.appendChild(nameSpan);
    customerDiv.appendChild(dateDiv)
    customerDiv.appendChild(ratingDiv);
    if (comment) {
      const commentP = document.createElement('p');
      commentP.className = 'review-item__comment';
      commentP.textContent = comment;
      customerDiv.appendChild(commentP);
    }

    footer.appendChild(customerDiv);

    // Assemble the card
    //reviewCard.appendChild(header);
    reviewCard.appendChild(content);
    reviewCard.appendChild(footer);

    return reviewCard.outerHTML;
  }

  function generateStarsHTML(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      const star = document.createElement('svg');
      star.className = 'review-star' + (filled ? ' review-star--filled' : '');
      star.setAttribute('viewBox', '0 0 24 24');
      star.setAttribute('width', '16');
      star.setAttribute('height', '16');

      const path = document.createElement('path');
      path.setAttribute('d', 'M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z');
      path.setAttribute('fill', filled ? 'currentColor' : 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '1');

      star.appendChild(path);
      starsHTML += star.outerHTML;
    }
    return starsHTML;
  }

  function generateSummaryReviews(reviews) {
    console.log("Summary- reviews2");
    const reviewsSummaryWrapper = document.getElementById('reviewsSummaryWrapper');
    const _reviewsSummarySort = document.getElementById('reviewsSummarySort');
    const reviewsCount = reviews.length;
    const reviewsNumericalResult = reviews.result.filter((res)=>res.value) || [];
    const rating = Number(reviewsNumericalResult.reduce((a, b)=>a.value + b.value, 0))/reviewsNumericalResult.length;
    const summaryReview__Review = document.createElement('span');
    const summaryReview__CaretDown = document.createElement('svg');

    summaryReview__CaretDown.className = 'caret-down';
    summaryReview__CaretDown.setAttribute('viewBox', '0 0 24 24');
    summaryReview__CaretDown.setAttribute('width', '24');
    summaryReview__CaretDown.setAttribute('height', '24');

    const path = document.createElement('path');
    path.setAttribute('d', 'M18 9c.852 0 1.297 .986 .783 1.623l-.076 .084l-6 6a1 1 0 0 1 -1.32 .083l-.094 -.083l-6 -6l-.083 -.094l-.054 -.077l-.054 -.096l-.017 -.036l-.027 -.067l-.032 -.108l-.01 -.053l-.01 -.06l-.004 -.057v-.118l.005 -.058l.009 -.06l.01 -.052l.032 -.108l.027 -.067l.07 -.132l.065 -.09l.073 -.081l.094 -.083l.077 -.054l.096 -.054l.036 -.017l.067 -.027l.108 -.032l.053 -.01l.06 -.01l.057 -.004l12.059 -.002z');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1');

    summaryReview__CaretDown.appendChild(path);

    const summaryReview__Text = document.createElement('p');
    summaryReview__Review.className = '';
    summaryReview__CaretDown.className = '';
    summaryReview__Text.textContent = reviewsCount;
    summaryReview__Review.innerHTML = generateStarsHTML(rating);
    reviewsSummaryWrapper.setAttribute('display', 'block');
    reviewsSummaryWrapper.appendChild(summaryReview__Review);
    reviewsSummaryWrapper.appendChild(summaryReview__Text);
    reviewsSummaryWrapper.appendChild(summaryReview__CaretDown);
    console.log("Summary- reviews", reviewsCount);
   /* summaryReviewDiv.appendChild(summaryReviewText);

    return summaryReviewDiv;*/
  }

  function generateHeader(reviews) {
    generateSummaryReviews(reviews);
    //generateNewReviewButton("button text");
    //generateSortElement(reviews);
    //Append htmls to appropriate id in header
  }

  function generateMediaElements(media) {
    const mediaDiv = document.createElement('div');
    mediaDiv.className = 'review-item__media';
    const item = media[0];
    const mediaURL = item.mediaURL || item.url;
    const isVideo = mediaURL && (mediaURL.includes('.mp4') || mediaURL.includes('.mov') || mediaURL.includes('.webm') || mediaURL.includes('video'));
    if (isVideo) {
      const video = document.createElement('video');
      video.className = 'review-media__item review-media__video';
      video.setAttribute('controls', '');
      video.setAttribute('preload', 'metadata');

      const source = document.createElement('source');
      source.src = mediaURL;
      source.type = 'video/mp4';

      video.appendChild(source);
      video.appendChild(document.createTextNode('Your browser does not support the video tag.'));
      mediaDiv.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.className = 'review-media__item review-media__image';
      img.src = mediaURL;
      img.alt = 'Review media';
      img.setAttribute('loading', 'lazy');
      img.onclick = function() { window.openMediaModal(mediaURL); };
      mediaDiv.appendChild(img);
    }
    return mediaDiv;
  }

  function showLoading() {
    loadingEl.style.display = 'flex';
    gridEl.style.display = 'none';
    errorEl.style.display = 'none';
  }

  function hideLoading() {
    loadingEl.style.display = 'none';
  }

  function showError() {
    hideLoading();
    errorEl.style.display = 'flex';
  }

  function showNoReviews() {
    hideLoading();
    gridEl.innerHTML = '<p class="no-reviews">No reviews available at this time.</p>';
    gridEl.style.display = 'block';
  }

  // Initialize on page load
  loadReviews();

  // Media Modal functionality
  window.openMediaModal = function(imageSrc) {
    let modal = document.getElementById('mediaModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mediaModal';
      modal.className = 'media-modal';
      modal.innerHTML = '<div class="media-modal__content"><button class="media-modal__close" onclick="window.closeMediaModal()">&times;</button><img class="media-modal__image" id="modalImage" src="" alt="Review media"></div>';
      document.body.appendChild(modal);

      modal.onclick = function(event) {
        if (event.target === modal) window.closeMediaModal();
      };

      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') window.closeMediaModal();
      });
    }

    document.getElementById('modalImage').src = imageSrc;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  };

  window.closeMediaModal = function() {
    const modal = document.getElementById('mediaModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  };

})()
