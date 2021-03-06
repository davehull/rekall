cmake_minimum_required (VERSION 2.8)

set(MODULE_NAME pmem_pte)
set(PACKAGED_NAME packaged_pmem)
set(MODULE_SOURCE_FILES pmem.c
  pte_mmap.c
  pte_mmap.h
  pte_mmap_linux.c
  pte_mmap_linux.h
)
set(MODULE_OUTPUT_DIR ${CMAKE_BINARY_DIR}/modules)
set(MODULE_FILE ${MODULE_NAME}.ko)
set(PACKAGED_FILE ${PACKAGED_NAME}.o)
# Drop Kbuild file in build directory
configure_file(Kbuild.in ${MODULE_OUTPUT_DIR}/Kbuild)
# Copy module sources to build directory
foreach(MODULE_SOURCE_FILE ${MODULE_SOURCE_FILES})
  configure_file(
    ${MODULE_SOURCE_FILE}
    ${MODULE_OUTPUT_DIR}/${MODULE_SOURCE_FILE}
    COPYONLY
  )
endforeach(MODULE_SOURCE_FILE)

set(KERNEL_DIR "/lib/modules/${CMAKE_SYSTEM_VERSION}/build" )

# Invoke Kbuild
add_custom_command(
  OUTPUT ${MODULE_OUTPUT_DIR}/${MODULE_FILE}
  COMMAND ${CMAKE_MAKE_PROGRAM}
          -C ${KERNEL_DIR}
          M=${MODULE_OUTPUT_DIR}
          modules
  WORKING_DIRECTORY ${MODULE_OUTPUT_DIR}
  DEPENDS ${MODULE_SOURCE_FILES} Kbuild.in
  COMMENT "compiling minpmem kernel module"
  VERBATIM
)

# Package minpmem so it can be linked into lmap
add_custom_command(
  OUTPUT ${MODULE_OUTPUT_DIR}/${PACKAGED_FILE}
  COMMAND strip --strip-unneeded -R .comment -R .modinfo -R .note.gnu.build-info 
    -R .gnu.linkonce.this_module -R __versions -R .note.gnu.build-id 
    -R .note.GNU-stack ${MODULE_OUTPUT_DIR}/${MODULE_FILE}
  COMMAND objcopy --input-target binary --output-target elf64-x86-64
  --binary-architecture i386 ${MODULE_OUTPUT_DIR}/${MODULE_FILE} ${MODULE_OUTPUT_DIR}/${PACKAGED_FILE}
  WORKING_DIRECTORY ${MODULE_OUTPUT_DIR}
  DEPENDS ${MODULE_OUTPUT_DIR}/${MODULE_FILE}
  COMMENT "packaging minpmem in a library"
  VERBATIM
)

# Make the module a target
add_custom_target(${MODULE_NAME} ALL DEPENDS ${MODULE_OUTPUT_DIR}/${MODULE_FILE})
# Finally create a library from our stripped pmem
add_library(minpmem STATIC ${MODULE_OUTPUT_DIR}/${PACKAGED_FILE})
# Since CMake didn't build this .o file need to tell it how to link it.
set_target_properties(minpmem PROPERTIES LINKER_LANGUAGE C)
