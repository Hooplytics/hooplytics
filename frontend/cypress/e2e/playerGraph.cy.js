describe('PlayerModal behavior', () => {
  beforeEach(() => {
    cy.intercept(
      'GET', '**/search/players*player=shai*',
      { fixture: 'sgaCard.json' }
    ).as('getSGA');
    cy.intercept(
      'GET', '**/player/1628983/games*',
      { fixture: 'sgaGames.json' })
      .as('getSGAGames');

    cy.visit('http://localhost:5173/home');
    cy.get('[data-cy="search"]').type('shai{enter}');
    cy.wait('@getSGA');
  });

  it('opens the modal, shows the passed-in stats, and can change graph filters', () => {
    cy.contains('h5', 'Shai Gilgeous-Alexander').parent('div.search-card').click();
    
    cy.get('[data-cy="player-modal"]').should('be.visible');

    cy.get('[data-cy="modal-name"]').should('contain.text', 'Shai Gilgeous-Alexander | OKC');

    cy.wait('@getSGAGames');

    cy.get('[data-cy="graph-stats"]').select('Assists');
    cy.get('[data-cy="graph-stats"]').should('have.value', 'assists');
  });
});