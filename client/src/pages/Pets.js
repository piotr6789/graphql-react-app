import React, { useState } from 'react';

import gql from 'graphql-tag';
import { useQuery, useMutation } from '@apollo/react-hooks';

import PetsList from '../components/PetsList';
import NewPetModal from '../components/NewPetModal';
import Loader from '../components/Loader';

const PET_FIELDS = gql`
  fragment PetFields on Pet {
    id
    name
    type
    img
    vaccinated @client
    owner {
      id
      age @client
    }
  }
`;

const ALL_PETS = gql`
  query AllPets {
    pets {
      ...PetFields
    }
  }
  ${PET_FIELDS}
`;

const NEW_PET = gql`
  mutation CreateAPet($newPet: NewPetInput!) {
    addPet(input: $newPet) {
      ...PetFields
    }
  }
  ${PET_FIELDS}
`;

const GET_PET = gql`
  query OnePet($petId: ID!) {
    pet(id: $petId) {
      id
      name
    }
  }
`;

const Pets = () => {
  const [modal, setModal] = useState(false);

  const { data, loading, error } = useQuery(ALL_PETS);
  const { data: onePet } = useQuery(GET_PET, {
    variables: { petId: '1jk3j4dksf' },
  });

  const [createPet, newPet] = useMutation(NEW_PET, {
    update(cache, { data: { addPet } }) {
      const data = cache.readQuery({ query: ALL_PETS });
      cache.writeQuery({
        query: ALL_PETS,
        data: { pets: [addPet, ...data.pets] },
      });
    },
  });

  const onSubmit = input => {
    setModal(false);
    createPet({
      variables: { newPet: input },
      optimisticResponse: {
        __typename: 'Mutation',
        addPet: {
          __typename: 'Pet',
          id: Math.floor(Math.random() * 1000).toString(),
          name: input.name,
          img: 'http://via.placeholder.com/300',
          type: input.type,
          vaccinated: true,
          owner: {
            id: Math.floor(Math.random() * 1000).toString(),
            age: 35,
            __typename: 'User',
          },
        },
      },
    });
  };

  if (loading) return <Loader />;

  if (error || newPet.error) return <p>Error!</p>;

  if (modal)
    return <NewPetModal {...{ onSubmit }} onCancel={() => setModal(false)} />;

  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>

          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <PetsList pets={data.pets} />
      </section>
    </div>
  );
};

export default Pets;
