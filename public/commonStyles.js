const commonStyles = `
  <style>
    .card {
      background: rgba(255, 255, 255, 0.7);
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.8);
    }

    .article {
      background: rgba(255, 255, 255, 0.7);
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .article:hover {
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.8);
    }
  </style>
`;

module.exports = commonStyles;