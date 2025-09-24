import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Traduções
const translations = {
  pt: {
    // Interface principal
    'app.title': 'Space Sculptor',
    'app.subtitle': 'Ferramenta de Geometria 3D',
    
    // Abas
    'tabs.geometry': 'Geometria 3D',
    'tabs.notes': 'Quadro de Anotações',
    
    // Controles de desenho
    'drawing.interaction': 'Interação',
    'drawing.visualization': 'Visualização',
    'drawing.connect_vertices': 'Conectar Vértices',
    'drawing.create_planes': 'Criar Planos',
    'drawing.measurements': 'Medições',
    'drawing.constructions': 'Construções',
    
    // Painéis de interação
    'interaction.navigate': 'Navegar',
    'interaction.connect_vertices': 'Conectar Vértices',
    'interaction.create_plane': 'Criar Plano',
    'interaction.constructions': 'Construções',
    
    // Painéis de visualização
    'visualization.cross_section': 'Seção Transversal',
    'visualization.meridian_section': 'Seção Meridiana',
    'visualization.dimensions': 'Dimensões',
    'visualization.shadow': 'Sombra',
    'visualization.unfolding': 'Planificação',
    
    // Modos de seleção de vértices
    'vertex_modes.title': 'Modos de Seleção de Vértices',
    'vertex_modes.meridian': 'Meridiana',
    'vertex_modes.planes': 'Planos',
    'vertex_modes.connections': 'Conexões',
    'vertex_modes.constructions': 'Construções',
    
    // Definição de planos
    'plane_definition.title': 'Definir Plano (3 Pontos)',
    
    // Formas inscritas/circunscritas
    'shapes.inscribed_circumscribed': 'Formas Inscritas/Circunscritas',
    'shapes.instruction': 'Selecione cubo, esfera, cilindro ou cone para ver opções de inscrição/circunscrição',
    
    // Cores
    'colors.edge_color': 'Cor das Arestas',
    'colors.meridian_section_color': 'Cor Seção Meridiana',
    'colors.height_color': 'Cor da Altura',
    'colors.face_color': 'Cor da Face',
    'colors.inscribed_circumference_color': 'Cor da Circunferência Inscrita',
    'colors.circumscribed_circumference_color': 'Cor da Circunferência Circunscrita',
    'colors.inscribed_shapes_color': 'Cor Formas Inscritas',
    'colors.circumscribed_shapes_color': 'Cor Formas Circunscritas',
    
    // Controles
    'controls.title': 'Controles',
    'controls.auto_rotation': 'Auto Rotação',
    'controls.reset_view': 'Resetar Vista',
    'controls.download': 'Baixar',
    
    // Opacidade e velocidade
    'opacity.meridian_section': 'Opacidade da Seção Meridiana',
    'opacity.general': 'Opacidade',
    'speed.rotation': 'Velocidade',
    
    // Dicas
    'tips.teachers': 'Dicas para Professores',
    
    // Termos geométricos
    'geometric.inscribed_radius': 'Raio Inscrito',
    'geometric.circumscribed_radius': 'Raio Circunscrito',
    'geometric.inscribed_circumference': 'Circunferência Inscrita',
    'geometric.circumscribed_circumference': 'Circunferência Circunscrita',
    'geometric.labels': 'Rótulos',
    'geometric.mesh': 'Malha',
    
    // Cores específicas - removed duplicates
    // 'colors.inscribed_circumference_color': 'Cor da Circunferência Inscrita',
    // 'colors.circumscribed_circumference_color': 'Cor da Circunferência Circunscrita',
    // 'colors.inscribed_shapes_color': 'Cor Formas Inscritas',
    // 'colors.circumscribed_shapes_color': 'Cor Formas Circunscritas',
    // 'colors.meridian_section_color': 'Cor da Seção Meridiana',
    
    // Propriedades restantes - removed duplicates
    // 'properties.total_area_label': 'Área Total:',
    // 'properties.volume_label': 'Volume:',
    
    // Dicas para professores
    'tips.pedagogical_strategies': 'Estratégias Pedagógicas',
    'tips.video_interaction': 'Interação em Videoaulas',
    'tips.group_dynamics': 'Dinâmicas de Grupo',
    'tips.advanced_resources': 'Recursos Avançados',
    'tips.special_tip': '💡 Dica especial: Use Ctrl+Click para múltiplas seleções no quadro de anotações e experimente diferentes combinações de visualização para criar explicações mais dinâmicas.',
    
    // Estratégias pedagógicas
    'strategies.rotation_3d': '• Use a rotação 3D para mostrar diferentes perspectivas da mesma forma',
    'strategies.volume_comparison': '• Compare volumes usando a visualização simultânea de diferentes geometrias',
    'strategies.color_demonstration': '• Demonstre conceitos de áreas lateral e total alterando as cores',
    'strategies.notes_highlighting': '• Use o quadro de anotações para destacar elementos importantes durante a explicação',
    
    // Interação em videoaulas
    'video.record_explanations': '• Grave explicações enquanto manipula as formas em tempo real',
    'video.digital_tablet': '• Use a mesa digitalizadora para fazer anotações diretas sobre as formas 3D',
    'video.light_dark_mode': '• Alterne entre modo claro e escuro conforme o ambiente de gravação',
    'video.screen_captures': '• Salve capturas de tela em momentos-chave da explicação',
    
    // Dinâmicas de grupo
    'group.project_screen': '• Projete na tela e peça para os alunos identificarem propriedades',
    'group.calculation_challenges': '• Crie desafios de cálculo usando os valores exibidos',
    'group.auto_rotation': '• Use o modo de rotação automática para discussões em grupo',
    'group.real_vs_virtual': '• Compare formas reais com os modelos virtuais',
    
    // Recursos avançados
    'advanced.inscribed_circumscribed': '• Mostre raios inscritos e circunscritos para conectar com trigonometria',
    'advanced.apothems': '• Use apótemas para explicar conceitos de geometria plana vs. espacial',
    'advanced.prism_sides': '• Varie números de lados em prismas para mostrar tendências matemáticas',
    'advanced.formula_connection': '• Conecte visualizações com fórmulas matemáticas em tempo real',
    
    // Botões
    'button.download': 'Baixar',
    
    // Propriedades
    'properties.base_area_label': 'Área da Base:',
    'properties.lateral_area_label': 'Área Lateral:',
    'properties.total_area_label': 'Área Total:',
    'properties.inscribed_radius_label': 'Raio Inscrito:',
    'properties.circumscribed_radius_label': 'Raio Circunscrito:',
    'properties.volume_label': 'Volume:',
    
    // Cálculos geométricos
    'calculations.title': 'Cálculos Geométricos',
    'calculations.inscribed_radius_apothem': 'Raio Inscrito (Apótema)',
    'calculations.center_to_edge_midpoint': 'centro ao meio da aresta',
    
    // Forma geométrica
    'geometry_form.title': 'Forma Geométrica',
    'geometry_form.type': 'Tipo',
    
    // Parâmetros específicos
    'params.height': 'Altura',
    'params.sides': 'Lados',
    'params.base_edge': 'Aresta da Base',
    
    // Painéis de interação e visualização - removed duplicates
    // 'interaction.title': 'Interação',
    // 'interaction.navigate': 'Navegar',
    // 'interaction.connect_vertices': 'Conectar Vértices',
    // 'interaction.create_plane': 'Criar Plano',
    // 'interaction.constructions': 'Construções',
    
    // Visualization - removed duplicates
    // 'visualization.title': 'Visualização',
    // 'visualization.cross_section': 'Seção Transversal',
    // 'visualization.meridian_section': 'Seção Meridiana',
    
    // Barra de ferramentas de desenho
    'drawing.activate_drawing': 'Ativar Desenho',
    'drawing.add_equation': 'Adicionar Equação',
    
    // Opções de geometria
    'geometry.prism': 'Prisma',
    'geometry.pyramid': 'Pirâmide',
    'geometry.cylinder': 'Cilindro',
    'geometry.cone': 'Cone',
    'geometry.cube': 'Cubo',
    'geometry.sphere': 'Esfera',
    'geometry.tetrahedron_4_faces': 'Tetraedro (4 faces)',
    'geometry.octahedron_8_faces': 'Octaedro (8 faces)',
    'geometry.dodecahedron_12_faces': 'Dodecaedro (12 faces)',
    'geometry.icosahedron_20_faces': 'Icosaedro (20 faces)',
    
    // Geometrias - removed duplicates
    // 'geometry.cube': 'Cubo',
    // 'geometry.tetrahedron': 'Tetraedro',
    // 'geometry.octahedron': 'Octaedro',
    // 'geometry.dodecahedron': 'Dodecaedro',
    // 'geometry.icosahedron': 'Icosaedro',
    // 'geometry.cylinder': 'Cilindro',
    // 'geometry.cone': 'Cone',
    // 'geometry.prism': 'Prisma',
    // 'geometry.pyramid': 'Pirâmide',
    
    // Opções de visualização
    'options.show_vertices': 'Mostrar Vértices',
    'options.show_edges': 'Mostrar Arestas',
    'options.show_faces': 'Mostrar Faces',
    'options.show_shadow': 'Mostrar Sombra',
    'options.show_height': 'Mostrar Altura',
    'options.show_radius': 'Mostrar Raio',
    'options.show_inscribed_radius': 'Mostrar Raio Inscrito',
    'options.show_circumscribed_radius': 'Mostrar Raio Circunscrito',
    'options.show_base_radius': 'Mostrar Raio da Base',
    
    // Parâmetros - removed duplicates
    // 'params.side_length': 'Comprimento da Aresta',
    // 'params.height': 'Altura',
    // 'params.radius': 'Raio',
    // 'params.base_edge_length': 'Comprimento da Aresta da Base',
    'params.num_sides': 'Número de Lados',
    
    // Mensagens
    'message.connection_created': 'Conexão criada!',
    'message.segment_removed': 'Segmento removido!',
    'message.plane_created': 'Plano criado!',
    'message.measurement_added': 'Medição adicionada!',
    
    // Botões
    'button.clear': 'Limpar',
    'button.delete': 'Excluir',
    'button.create': 'Criar',
    'button.cancel': 'Cancelar',
    'button.save': 'Salvar',
    'button.load': 'Carregar',
    'button.freeze_view': 'Congelar Vista',
    'button.unfreeze_view': 'Descongelar Vista',
    'button.deactivate': 'Desativar',
    
    // Modos de vértice
    'vertex_mode.connection': 'Conexão',
    'vertex_mode.plane': 'Plano',
    'vertex_mode.measurement': 'Medição',
    
    // Cores
    'color.vertex': 'Vértice',
    'color.edge': 'Aresta',
    'color.face': 'Face',
    'color.segment': 'Segmento',
    'color.plane': 'Plano',
    
    // Ferramentas
    'tool.select': 'Seleção',
    'tool.pen': 'Caneta',
    'tool.eraser': 'Borracha',
    'tool.text': 'Texto',
    'tool.unknown': 'Ferramenta',
    
    // Painéis
    'panel.parameters': 'Parâmetros',
    'panel.visualization': 'Visualização',
    'panel.style': 'Estilo',
    'panel.properties': 'Propriedades',
    
    // Propriedades
    'properties.base_area': 'Área da Base',
    'properties.lateral_area': 'Área Lateral',
    'properties.total_area': 'Área Total',
    'properties.volume': 'Volume',
    'properties.inscribed_radius': 'Raio Inscrito',
    'properties.circumscribed_radius': 'Raio Circunscrito',
    
    // Idioma
    'language.portuguese': 'Português',
    'language.english': 'English',
  },
  en: {
    // Main interface
    'app.title': 'Space Sculptor',
    'app.subtitle': '3D Geometry Tool',
    
    // Tabs
    'tabs.geometry': '3D Geometry',
    'tabs.notes': 'Notes Board',
    
    // Drawing controls
    'drawing.interaction': 'Interaction',
    'drawing.visualization': 'Visualization',
    'drawing.connect_vertices': 'Connect Vertices',
    'drawing.create_planes': 'Create Planes',
    'drawing.measurements': 'Measurements',
    'drawing.constructions': 'Constructions',
    
    // Interaction panels
    'interaction.navigate': 'Navigate',
    'interaction.connect_vertices': 'Connect Vertices',
    'interaction.create_plane': 'Create Plane',
    'interaction.constructions': 'Constructions',
    
    // Visualization panels
    'visualization.cross_section': 'Cross Section',
    'visualization.meridian_section': 'Meridian Section',
    'visualization.dimensions': 'Dimensions',
    'visualization.shadow': 'Shadow',
    'visualization.unfolding': 'Unfolding',
    
    // Vertex selection modes
    'vertex_modes.title': 'Vertex Selection Modes',
    'vertex_modes.meridian': 'Meridian',
    'vertex_modes.planes': 'Planes',
    'vertex_modes.connections': 'Connections',
    'vertex_modes.constructions': 'Constructions',
    
    // Plane definition
    'plane_definition.title': 'Define Plane (3 Points)',
    
    // Inscribed/circumscribed shapes
    'shapes.inscribed_circumscribed': 'Inscribed/Circumscribed Shapes',
    'shapes.instruction': 'Select cube, sphere, cylinder or cone to see inscription/circumscription options',
    
    // Colors
    'colors.edge_color': 'Edge Color',
    'colors.meridian_section_color': 'Meridian Section Color',
    'colors.height_color': 'Height Color',
    'colors.face_color': 'Face Color',
    'colors.inscribed_circumference_color': 'Inscribed Circumference Color',
    'colors.circumscribed_circumference_color': 'Circumscribed Circumference Color',
    'colors.inscribed_shapes_color': 'Inscribed Shapes Color',
    'colors.circumscribed_shapes_color': 'Circumscribed Shapes Color',
    
    // Controls
    'controls.title': 'Controls',
    'controls.auto_rotation': 'Auto Rotation',
    'controls.reset_view': 'Reset View',
    'controls.download': 'Download',
    
    // Opacity and speed
    'opacity.meridian_section': 'Meridian Section Opacity',
    'opacity.general': 'Opacity',
    'speed.rotation': 'Speed',
    
    // Tips
    'tips.teachers': 'Tips for Teachers',
    
    // Geometric terms
    'geometric.inscribed_radius': 'Inscribed Radius',
    'geometric.circumscribed_radius': 'Circumscribed Radius',
    'geometric.inscribed_circumference': 'Inscribed Circumference',
    'geometric.circumscribed_circumference': 'Circumscribed Circumference',
    'geometric.labels': 'Labels',
    'geometric.mesh': 'Mesh',
    
    // Specific colors - removed duplicates
    // 'colors.inscribed_circumference_color': 'Inscribed Circumference Color',
    // 'colors.circumscribed_circumference_color': 'Circumscribed Circumference Color',
    // 'colors.inscribed_shapes_color': 'Inscribed Shapes Color',
    // 'colors.circumscribed_shapes_color': 'Circumscribed Shapes Color',
    // 'colors.meridian_section_color': 'Meridian Section Color',
    
    // Remaining properties - removed duplicates
    // 'properties.total_area_label': 'Total Area:',
    // 'properties.volume_label': 'Volume:',
    
    // Tips for teachers
    'tips.pedagogical_strategies': 'Pedagogical Strategies',
    'tips.video_interaction': 'Video Lesson Interaction',
    'tips.group_dynamics': 'Group Dynamics',
    'tips.advanced_resources': 'Advanced Resources',
    'tips.special_tip': '💡 Special tip: Use Ctrl+Click for multiple selections in the notes board and experiment with different visualization combinations to create more dynamic explanations.',
    
    // Pedagogical strategies
    'strategies.rotation_3d': '• Use 3D rotation to show different perspectives of the same shape',
    'strategies.volume_comparison': '• Compare volumes using simultaneous visualization of different geometries',
    'strategies.color_demonstration': '• Demonstrate lateral and total area concepts by changing colors',
    'strategies.notes_highlighting': '• Use the notes board to highlight important elements during explanation',
    
    // Video lesson interaction
    'video.record_explanations': '• Record explanations while manipulating shapes in real time',
    'video.digital_tablet': '• Use a digital tablet to make direct annotations on 3D shapes',
    'video.light_dark_mode': '• Switch between light and dark mode according to recording environment',
    'video.screen_captures': '• Save screen captures at key moments of explanation',
    
    // Group dynamics
    'group.project_screen': '• Project on screen and ask students to identify properties',
    'group.calculation_challenges': '• Create calculation challenges using displayed values',
    'group.auto_rotation': '• Use auto rotation mode for group discussions',
    'group.real_vs_virtual': '• Compare real shapes with virtual models',
    
    // Advanced resources
    'advanced.inscribed_circumscribed': '• Show inscribed and circumscribed radii to connect with trigonometry',
    'advanced.apothems': '• Use apothems to explain plane vs. spatial geometry concepts',
    'advanced.prism_sides': '• Vary numbers of sides in prisms to show mathematical trends',
    'advanced.formula_connection': '• Connect visualizations with mathematical formulas in real time',
    
    // Buttons
    'button.download': 'Download',
    
    // Properties
    'properties.base_area_label': 'Base Area:',
    'properties.lateral_area_label': 'Lateral Area:',
    'properties.total_area_label': 'Total Area:',
    'properties.inscribed_radius_label': 'Inscribed Radius:',
    'properties.circumscribed_radius_label': 'Circumscribed Radius:',
    'properties.volume_label': 'Volume:',
    
    // Geometric calculations
    'calculations.title': 'Geometric Calculations',
    'calculations.inscribed_radius_apothem': 'Inscribed Radius (Apothem)',
    'calculations.center_to_edge_midpoint': 'center to edge midpoint',
    
    // Geometric form
    'geometry_form.title': 'Geometric Form',
    'geometry_form.type': 'Type',
    
    // Specific parameters
    'params.height': 'Height',
    'params.sides': 'Sides',
    'params.base_edge': 'Base Edge',
    
    // Interaction and visualization panels - removed duplicates
    // 'interaction.title': 'Interaction',
    // 'interaction.navigate': 'Navigate',
    // 'interaction.connect_vertices': 'Connect Vertices',
    // 'interaction.create_plane': 'Create Plane',
    // 'interaction.constructions': 'Constructions',
    
    // 'visualization.title': 'Visualization',
    // 'visualization.cross_section': 'Cross Section',
    // 'visualization.meridian_section': 'Meridian Section',
    
    // Drawing toolbar
    'drawing.activate_drawing': 'Activate Drawing',
    'drawing.add_equation': 'Add Equation',
    
    // Geometry options
    'geometry.prism': 'Prism',
    'geometry.pyramid': 'Pyramid',
    'geometry.cylinder': 'Cylinder',
    'geometry.cone': 'Cone',
    'geometry.cube': 'Cube',
    'geometry.sphere': 'Sphere',
    'geometry.tetrahedron_4_faces': 'Tetrahedron (4 faces)',
    'geometry.octahedron_8_faces': 'Octahedron (8 faces)',
    'geometry.dodecahedron_12_faces': 'Dodecahedron (12 faces)',
    'geometry.icosahedron_20_faces': 'Icosahedron (20 faces)',
    
    // Geometries - removed duplicates
    // 'geometry.cube': 'Cube',
    // 'geometry.tetrahedron': 'Tetrahedron',
    // 'geometry.octahedron': 'Octahedron',
    // 'geometry.dodecahedron': 'Dodecahedron',
    // 'geometry.icosahedron': 'Icosahedron',
    // 'geometry.cylinder': 'Cylinder',
    // 'geometry.cone': 'Cone',
    // 'geometry.prism': 'Prism',
    // 'geometry.pyramid': 'Pyramid',
    
    // Visualization options
    'options.show_vertices': 'Show Vertices',
    'options.show_edges': 'Show Edges',
    'options.show_faces': 'Show Faces',
    'options.show_shadow': 'Show Shadow',
    'options.show_height': 'Show Height',
    'options.show_radius': 'Show Radius',
    'options.show_inscribed_radius': 'Show Inscribed Radius',
    'options.show_circumscribed_radius': 'Show Circumscribed Radius',
    'options.show_base_radius': 'Show Base Radius',
    
    // Parameters - removed duplicates
    // 'params.side_length': 'Side Length',
    // 'params.height': 'Height',
    // 'params.radius': 'Radius',
    // 'params.base_edge_length': 'Base Edge Length',
    'params.num_sides': 'Number of Sides',
    
    // Messages
    'message.connection_created': 'Connection created!',
    'message.segment_removed': 'Segment removed!',
    'message.plane_created': 'Plane created!',
    'message.measurement_added': 'Measurement added!',
    
    // Buttons
    'button.clear': 'Clear',
    'button.delete': 'Delete',
    'button.create': 'Create',
    'button.cancel': 'Cancel',
    'button.save': 'Save',
    'button.load': 'Load',
    'button.freeze_view': 'Freeze View',
    'button.unfreeze_view': 'Unfreeze View',
    'button.deactivate': 'Deactivate',
    
    // Vertex modes
    'vertex_mode.connection': 'Connection',
    'vertex_mode.plane': 'Plane',
    'vertex_mode.measurement': 'Measurement',
    
    // Colors
    'color.vertex': 'Vertex',
    'color.edge': 'Edge',
    'color.face': 'Face',
    'color.segment': 'Segment',
    'color.plane': 'Plane',
    
    // Tools
    'tool.select': 'Select',
    'tool.pen': 'Pen',
    'tool.eraser': 'Eraser',
    'tool.text': 'Text',
    'tool.unknown': 'Tool',
    
    // Panels
    'panel.parameters': 'Parameters',
    'panel.visualization': 'Visualization',
    'panel.style': 'Style',
    'panel.properties': 'Properties',
    
    // Properties
    'properties.base_area': 'Base Area',
    'properties.lateral_area': 'Lateral Area',
    'properties.total_area': 'Total Area',
    'properties.volume': 'Volume',
    'properties.inscribed_radius': 'Inscribed Radius',
    'properties.circumscribed_radius': 'Circumscribed Radius',
    
    // Language
    'language.portuguese': 'Português',
    'language.english': 'English',
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Verificar se há idioma salvo no localStorage
    const savedLanguage = localStorage.getItem('space-sculptor-language') as Language;
    return savedLanguage || 'pt';
  });

  useEffect(() => {
    // Salvar idioma no localStorage
    localStorage.setItem('space-sculptor-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
