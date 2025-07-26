describe('PlayerModal behavior', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/search/players*player=shai*', { fixture: 'sgaCard.json' }).as('getSGA');
    cy.intercept('GET', '**/player/1628983/games*',    { fixture: 'sgaGames.json' }).as('getSGAGames');

    cy.intercept(
      { method: 'GET', url: '**/predict*' },
      { body: 42 }   
    ).as('postPredict');

    cy.visit('http://localhost:5173/home');
    cy.get('[data-cy="search"]').type('shai{enter}');
    cy.wait('@getSGA');
    cy.get('div.search-card').should('have.length', 1);
    cy.contains('h5', 'Shai Gilgeous-Alexander').click();
    cy.wait('@getSGAGames');
  });

  it('tests if score prediction works', () => {
    cy.get('[data-cy="prediction-button"]').click();

    cy.wait('@postPredict');

    cy.get('[data-cy="predicted-points"]')
      .should('be.visible')
      .and('contain.text', 'Predicted points for next game: 42');
  });
});
