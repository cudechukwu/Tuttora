import { Request, Response } from 'express';

interface Avatar {
  id: string;
  name: string;
  url: string;
  category?: string;
}

// Mock avatar data - in production, this would come from a database
const avatars: Avatar[] = [
  { id: '1', name: 'White Glasses', url: '/images/avatars/white-glasses.jpg', category: 'glasses' },
  { id: '2', name: 'Black Curly', url: '/images/avatars/black-curly.jpg', category: 'hair' },
  { id: '3', name: 'Schoolboy', url: '/images/avatars/schoolboy.png', category: 'student' },
  { id: '4', name: 'Brunette', url: '/images/avatars/brunette.png', category: 'hair' },
  { id: '5', name: 'White Girl', url: '/images/avatars/whitegirl.jpg', category: 'hair' },
  { id: '6', name: 'Asian', url: '/images/avatars/asian.jpg', category: 'ethnicity' },
  { id: '7', name: 'Fade', url: '/images/avatars/fade.png', category: 'hair' },
  { id: '8', name: 'Latin Woman', url: '/images/avatars/latin-woman.jpg', category: 'ethnicity' },
  { id: '9', name: 'Smily Girl', url: '/images/avatars/smilygirl.png', category: 'expression' },
  { id: '10', name: 'Jasmine', url: '/images/avatars/jasmine.png', category: 'hair' },
  { id: '11', name: 'Afro', url: '/images/avatars/afro.png', category: 'hair' },
  { id: '12', name: 'Black Afro', url: '/images/avatars/black-afro.png', category: 'hair' },
  { id: '13', name: 'Chill Guy', url: '/images/avatars/chillguy.png', category: 'expression' },
  { id: '14', name: 'Punk', url: '/images/avatars/punk.png', category: 'style' },
  { id: '15', name: 'Black Beard', url: '/images/avatars/black-beard.jpg', category: 'facial' },
  { id: '16', name: 'White Beard', url: '/images/avatars/white-beard.jpg', category: 'facial' },
  { id: '17', name: 'Brown Hair', url: '/images/avatars/brownhair.png', category: 'hair' },
];

export const getAvatars = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    let filteredAvatars = avatars;
    
    if (category && typeof category === 'string') {
      filteredAvatars = avatars.filter(avatar => avatar.category === category);
    }
    
    res.json({
      success: true,
      data: filteredAvatars,
      total: filteredAvatars.length
    });
  } catch (error) {
    console.error('Error fetching avatars:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch avatars'
    });
  }
};

export const getAvatarById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const avatar = avatars.find(a => a.id === id);
    
    if (!avatar) {
      return res.status(404).json({
        success: false,
        error: 'Avatar not found'
      });
    }
    
    res.json({
      success: true,
      data: avatar
    });
  } catch (error) {
    console.error('Error fetching avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch avatar'
    });
  }
}; 