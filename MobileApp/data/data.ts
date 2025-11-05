/* eslint-disable @typescript-eslint/no-require-imports */
  
  export const featuredPlaylists = [
    {
      id: '1',
      title: 'Worship Hits',
      description: 'Top worship songs',
      imageUrl: 'https://example.com/image1.jpg',
      songCount: 12
    },
    {
      id: '2',
      title: 'Gospel Mix',
      description: 'Inspiring gospel tracks',
      imageUrl: 'https://example.com/image2.jpg',
      songCount: 15
    },
     {
      id: '3',
      title: 'Gospel Mix',
      description: 'Inspiring gospel tracks',
      imageUrl: 'https://example.com/image2.jpg',
      songCount: 15
    },
     {
      id: '4',
      title: 'Gospel Mix',
      description: 'Inspiring gospel tracks',
      imageUrl: 'https://example.com/image2.jpg',
      songCount: 15
    },
     {
      id: '5',
      title: 'Gospel Mix',
      description: 'Inspiring gospel tracks',
      imageUrl: 'https://example.com/image2.jpg',
      songCount: 15
    },
    // Add more playlists...
  ];

  export const recentSongs = [
    {
      id: '1',
      title: 'Amazing Grace',
      artist: 'ClaudyGod',
      duration: '4:32',
      album: 'Worship Collection'
    },
    // Add more songs...
  ];

 export  const currentSong = {
    id: '1',
    title: 'Amazing Grace',
    artist: 'ClaudyGod',
    album: 'Worship Collection',
    duration: '4:32',
    imageUrl: 'https://example.com/current.jpg'
  };
// components/data/data.ts
export const defaultSlides = [
  {
    id: '1',
    title: 'New Album Release',
    subtitle: 'You are our Everything',
    description: 'Experience the latest worship album "You are our everything" featuring powerful new tracks that will uplift your spirit.',
    backgroundImage: require('../assets/images/CoverArt.webp'), // Use require for local images
    ctaText: 'Stream Now'
  },
  {
    id: '2',
    title: 'Live Concert Tour',
    subtitle: 'Coming to Your City',
    description: 'Join us for an unforgettable night of worship and praise across major cities worldwide.',
    backgroundImage: require('../assets/images/FB_IMG_1743103252303.jpg'),
  },
  {
    id: '3',
    title: 'Exclusive Merchandise',
    subtitle: 'Limited Edition',
    description: 'Get your hands on our new merchandise collection inspired by the latest album designs.',
     backgroundImage: require('../assets/images/music4.webp'),
    ctaText: 'Shop Now'
  }
];